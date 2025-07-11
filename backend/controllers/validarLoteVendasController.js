const pool = require('../config/dbConfig');

/**
 * Valida um lote de vendas antes da confirmação
 * Verifica se os itens estão disponíveis, se as quantidades são suficientes,
 * se há conflitos de status e outras validações necessárias
 */
async function validarLoteVendas(req, res) {
  const { itens_vendidos_ids, cliente_nome, valor_total, unidade_gestora, numero_pedido_compra } = req.body;

  if (!itens_vendidos_ids || itens_vendidos_ids.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nenhum item de venda fornecido para validação.' 
    });
  }

  try {
    // 1. Verificar se todos os itens existem e estão disponíveis
    const queryItens = `
      SELECT 
        inf.id,
        inf.material,
        inf.quantidade,
        nf.status as status_nota,
        nf.numero_nota,
        nf.emitente_nome,
        nf.cliente_id,
        nf.numero_pedido_compra as pedido_atual
      FROM itens_notas_fiscais inf
      JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
      WHERE inf.id = ANY($1::int[])
      ORDER BY inf.id
    `;
    
    const resultItens = await pool.query(queryItens, [itens_vendidos_ids]);
    
    if (resultItens.rows.length !== itens_vendidos_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Alguns itens não foram encontrados no sistema.',
        detalhes: {
          itens_solicitados: itens_vendidos_ids.length,
          itens_encontrados: resultItens.rows.length
        }
      });
    }

    // 2. Validar status das notas fiscais e pedidos de compra
    const itensComProblemas = [];
    const itensValidos = [];
    let valorTotalCalculado = 0;
    const pedidosCompraEncontrados = new Set();

    for (const item of resultItens.rows) {
      const problemas = [];
      
      // Verificar se a nota fiscal está disponível
      if (item.status_nota !== 'disponivel' && item.status_nota !== 'em_lote') {
        problemas.push(`Nota fiscal ${item.numero_nota} com status inválido: ${item.status_nota}`);
      }
      
      // Verificar se o item já foi vendido
      if (item.venda_id) {
        problemas.push(`Item já vendido anteriormente`);
      }

      // Verificar se a nota já tem um pedido de compra diferente
      if (item.pedido_atual && item.pedido_atual !== numero_pedido_compra) {
        problemas.push(`Nota fiscal ${item.numero_nota} já está associada ao pedido: ${item.pedido_atual}`);
      }

      // Coletar pedidos de compra encontrados
      if (item.pedido_atual) {
        pedidosCompraEncontrados.add(item.pedido_atual);
      }
      
      // Calcular valor total baseado no material
      const valorUnitario = item.material === 'Papel' ? 800.00 :
                           item.material === 'Papelão' ? 600.00 :
                           item.material === 'Vidro' ? 1200.00 :
                           item.material === 'Metal' ? 1500.00 :
                           item.material === 'Plástico' ? 1000.00 : 800.00;
      const valorItem = valorUnitario * (parseFloat(item.quantidade) / 1000.0);
      valorTotalCalculado += valorItem;
      
      if (problemas.length > 0) {
        itensComProblemas.push({
          id: item.id,
          material: item.material,
          quantidade: item.quantidade,
          numero_nota: item.numero_nota,
          pedido_atual: item.pedido_atual,
          problemas: problemas
        });
      } else {
        itensValidos.push(item);
      }
    }

    // 3. Validar valor total
    const valorTotalRecebido = parseFloat(valor_total) || 0;
    const diferencaValor = Math.abs(valorTotalCalculado - valorTotalRecebido);
    const toleranciaValor = valorTotalCalculado * 0.01; // 1% de tolerância

    if (diferencaValor > toleranciaValor) {
      return res.status(400).json({
        success: false,
        message: 'Valor total não corresponde à soma dos itens.',
        detalhes: {
          valor_calculado: valorTotalCalculado.toFixed(2),
          valor_recebido: valorTotalRecebido.toFixed(2),
          diferenca: diferencaValor.toFixed(2)
        }
      });
    }

    // 4. Verificar se há itens com problemas
    if (itensComProblemas.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Alguns itens possuem problemas que impedem a venda.',
        itens_com_problemas: itensComProblemas,
        itens_validos: itensValidos.length
      });
    }

    // 5. Verificar disponibilidade de estoque (quantidades)
    const materiaisUnicos = [...new Set(itensValidos.map(item => item.material))];
    const disponibilidadeEstoque = [];

    for (const material of materiaisUnicos) {
      const itensMaterial = itensValidos.filter(item => item.material === material);
      const quantidadeSolicitada = itensMaterial.reduce((sum, item) => sum + parseFloat(item.quantidade), 0);
      
      // Consultar estoque disponível para o material
      const queryEstoque = `
        SELECT 
          COALESCE(SUM(inf.quantidade::float), 0) as quantidade_disponivel
        FROM itens_notas_fiscais inf
        JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
        WHERE UPPER(inf.material) = UPPER($1) 
        AND nf.status IN ('disponivel', 'em_lote')
        AND inf.venda_id IS NULL
      `;
      
      const resultEstoque = await pool.query(queryEstoque, [material]);
      const quantidadeDisponivel = parseFloat(resultEstoque.rows[0].quantidade_disponivel);
      
      if (quantidadeSolicitada > quantidadeDisponivel) {
        disponibilidadeEstoque.push({
          material: material,
          quantidade_solicitada: quantidadeSolicitada,
          quantidade_disponivel: quantidadeDisponivel,
          deficit: quantidadeSolicitada - quantidadeDisponivel
        });
      }
    }

    if (disponibilidadeEstoque.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade solicitada excede o estoque disponível.',
        disponibilidade_estoque: disponibilidadeEstoque
      });
    }

    // 6. Validação de unidade gestora
    if (!unidade_gestora || unidade_gestora.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Unidade gestora é obrigatória.'
      });
    }

    // 7. Validação de cliente
    if (!cliente_nome || cliente_nome.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nome do cliente é obrigatório.'
      });
    }

    // 8. Validação do número do pedido de compra
    if (!numero_pedido_compra || numero_pedido_compra.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Número do pedido de compra é obrigatório.'
      });
    }

    // Se chegou até aqui, o lote está válido
    res.status(200).json({
      success: true,
      message: 'Lote de vendas validado com sucesso!',
      resumo: {
        total_itens: itensValidos.length,
        valor_total: valorTotalCalculado.toFixed(2),
        materiais_diferentes: materiaisUnicos.length,
        cliente: cliente_nome,
        unidade_gestora: unidade_gestora,
        numero_pedido_compra: numero_pedido_compra,
        pedidos_compra_encontrados: Array.from(pedidosCompraEncontrados)
      },
      itens_validados: itensValidos.map(item => ({
        id: item.id,
        material: item.material,
        quantidade: item.quantidade,
        numero_nota: item.numero_nota,
        pedido_atual: item.pedido_atual
      }))
    });

  } catch (error) {
    console.error('[validarLoteVendasController.js] Erro ao validar lote de vendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante a validação.',
      error: process.env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : undefined
    });
  }
}

/**
 * Valida um item específico de venda
 */
async function validarItemVenda(req, res) {
  const { item_id } = req.params;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      message: 'ID do item é obrigatório.'
    });
  }

  try {
    const query = `
      SELECT 
        inf.id,
        inf.material,
        inf.quantidade,
        nf.status as status_nota,
        nf.numero_nota,
        nf.emitente_nome,
        nf.cliente_id,
        nf.numero_pedido_compra as pedido_atual,
        inf.venda_id
      FROM itens_notas_fiscais inf
      JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
      WHERE inf.id = $1
    `;
    
    const result = await pool.query(query, [item_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado.'
      });
    }

    const item = result.rows[0];
    const problemas = [];
    const avisos = [];

    // Verificações de validação
    if (item.status_nota !== 'disponivel' && item.status_nota !== 'em_lote') {
      problemas.push(`Status da nota fiscal inválido: ${item.status_nota}`);
    }

    if (item.venda_id) {
      problemas.push('Item já foi vendido anteriormente');
    }

    if (parseFloat(item.quantidade) <= 0) {
      problemas.push('Quantidade deve ser maior que zero');
    }

    // Removido validação de valor_unitario pois não existe na tabela

    // Verificar disponibilidade no estoque
    const queryEstoque = `
      SELECT 
        COALESCE(SUM(inf.quantidade::float), 0) as quantidade_disponivel
      FROM itens_notas_fiscais inf
      JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
      WHERE UPPER(inf.material) = UPPER($1) 
      AND nf.status IN ('disponivel', 'em_lote')
      AND inf.venda_id IS NULL
    `;
    
    const resultEstoque = await pool.query(queryEstoque, [item.material]);
    const quantidadeDisponivel = parseFloat(resultEstoque.rows[0].quantidade_disponivel);
    
    if (parseFloat(item.quantidade) > quantidadeDisponivel) {
      problemas.push(`Quantidade solicitada (${item.quantidade}) excede estoque disponível (${quantidadeDisponivel})`);
    }

    // Avisos (não impedem a venda, mas são importantes)
    if (item.status_nota === 'em_lote') {
      avisos.push('Item está em lote - verificar se pode ser vendido individualmente');
    }

    if (item.pedido_atual) {
      avisos.push(`Nota fiscal já está associada ao pedido de compra: ${item.pedido_atual}`);
    }

    const isValido = problemas.length === 0;

    res.status(200).json({
      success: true,
      item: {
        id: item.id,
        material: item.material,
        quantidade: item.quantidade,
        numero_nota: item.numero_nota,
        emitente_nome: item.emitente_nome,
        status_nota: item.status_nota,
        pedido_atual: item.pedido_atual
      },
      validacao: {
        is_valido: isValido,
        problemas: problemas,
        avisos: avisos,
        quantidade_disponivel_estoque: quantidadeDisponivel
      }
    });

  } catch (error) {
    console.error('[validarLoteVendasController.js] Erro ao validar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante a validação do item.',
      error: process.env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : undefined
    });
  }
}

/**
 * Obtém estatísticas de validação de lotes
 */
async function getEstatisticasValidacao(req, res) {
  try {
    // Estatísticas gerais de vendas e validações
    const queryStats = `
      SELECT 
        COUNT(*) as total_vendas,
        COUNT(CASE WHEN data_venda >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as vendas_ultimos_30_dias,
        SUM(valor_total) as valor_total_vendido,
        COUNT(DISTINCT cliente_nome) as clientes_diferentes
      FROM vendas
    `;
    
    const resultStats = await pool.query(queryStats);
    const stats = resultStats.rows[0];

    // Itens com problemas de validação
    const queryItensProblemas = `
      SELECT 
        COUNT(*) as total_itens,
        COUNT(CASE WHEN nf.status NOT IN ('disponivel', 'em_lote') THEN 1 END) as itens_status_invalido,
        COUNT(CASE WHEN inf.venda_id IS NOT NULL THEN 1 END) as itens_ja_vendidos
      FROM itens_notas_fiscais inf
      JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
    `;
    
    const resultItens = await pool.query(queryItensProblemas);
    const itensStats = resultItens.rows[0];

    res.status(200).json({
      success: true,
      estatisticas: {
        vendas: {
          total: parseInt(stats.total_vendas) || 0,
          ultimos_30_dias: parseInt(stats.vendas_ultimos_30_dias) || 0,
          valor_total: parseFloat(stats.valor_total_vendido) || 0,
          clientes_diferentes: parseInt(stats.clientes_diferentes) || 0
        },
        itens: {
          total: parseInt(itensStats.total_itens) || 0,
          status_invalido: parseInt(itensStats.itens_status_invalido) || 0,
          ja_vendidos: parseInt(itensStats.itens_ja_vendidos) || 0
        }
      }
    });

  } catch (error) {
    console.error('[validarLoteVendasController.js] Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao obter estatísticas.',
      error: process.env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : undefined
    });
  }
}

module.exports = {
  validarLoteVendas,
  validarItemVenda,
  getEstatisticasValidacao
}; 