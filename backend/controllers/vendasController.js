// backend/controllers/vendasController.js
const pool = require("../config/dbConfig"); // Usando dbConfig conforme seu require

async function registrarVenda(req, res) {
  // Payload do frontend usa snake_case, incluindo os novos campos
  const {
    itens_vendidos_ids,
    cliente_nome,
    cliente_documento,
    valor_total,
    numero_pedido_compra,
    unidade_gestora,
    data_venda,
    observacoes,
    numero_nf_servico,
    cliente_final,
    valor_por_tonelada // <-- Adicionado
  } = req.body;

  console.log("[Backend] Dados recebidos para registrar venda:", req.body);

  if (!itens_vendidos_ids || itens_vendidos_ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Nenhum item de venda fornecido." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN"); // Inicia a transação

    // 1. Inserir a venda na tabela 'vendas' com os novos campos
    const vendaResult = await client.query(
      `INSERT INTO vendas (
         cliente_nome, cliente_documento, valor_total, numero_pedido_compra, 
         unidade_gestora, data_venda, observacoes, numero_nf_servico, cliente_final, valor_por_tonelada, data_registro
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING id`,
      [
        cliente_nome,
        cliente_documento,
        valor_total,
        numero_pedido_compra,
        unidade_gestora,
        data_venda,
        observacoes,
        numero_nf_servico,
        cliente_final,
        valor_por_tonelada // <-- Adicionado
      ]
    );
    const vendaId = vendaResult.rows[0].id;
    console.log(`[Backend] Nova Venda registrada com ID: ${vendaId}`);

    // 2. Atualizar o status das notas fiscais-mãe para 'vendida'
    // Esta query atualiza a nota fiscal inteira se qualquer um de seus itens for vendido.
    const updateNotasQuery = `
      UPDATE notas_fiscais
      SET status = $1, numero_pedido_compra = $2
      WHERE id IN (
        SELECT DISTINCT nota_fiscal_id 
        FROM itens_notas_fiscais 
        WHERE id = ANY($3::int[])
      )`;
    await client.query(updateNotasQuery, [
      "vendida",
      numero_pedido_compra,
      itens_vendidos_ids,
    ]);
    console.log(
      `[Backend] Notas fiscais associadas aos itens [${itens_vendidos_ids.join(
        ", "
      )}] atualizadas para 'vendida' com Pedido de Compra ${numero_pedido_compra}.`
    );

    // 3. (Recomendado) Associar os itens vendidos diretamente à venda.
    // Isso requer uma coluna 'venda_id' na tabela 'itens_notas_fiscais'.
    const updateItensQuery = `
      UPDATE itens_notas_fiscais
      SET venda_id = $1
      WHERE id = ANY($2::int[])`;
    await client.query(updateItensQuery, [vendaId, itens_vendidos_ids]);
    console.log(
      `[Backend] Itens [${itens_vendidos_ids.join(
        ", "
      )}] associados à Venda ID ${vendaId}.`
    );

    await client.query("COMMIT"); // Confirma a transação
    console.log("[Backend] Venda registrada e notas/itens atualizados com sucesso!");
    
    // Verificar se as notas foram realmente atualizadas
    const notasAtualizadas = await client.query(`
      SELECT COUNT(*) as total
      FROM notas_fiscais 
      WHERE id IN (
        SELECT DISTINCT nota_fiscal_id 
        FROM itens_notas_fiscais 
        WHERE id = ANY($1::int[])
      ) AND status = 'vendida'
    `, [itens_vendidos_ids]);
    
    const totalNotasAtualizadas = parseInt(notasAtualizadas.rows[0].total);
    
    res.status(200).json({
      success: true,
      message: `Venda registrada com sucesso! ${totalNotasAtualizadas} nota(s) fiscal(is) marcada(s) como vendida(s).`,
      dados_venda: {
        venda_id: vendaId,
        cliente_nome: cliente_nome,
        valor_total: valor_total,
        itens_vendidos: itens_vendidos_ids.length,
        notas_atualizadas: totalNotasAtualizadas
      }
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK"); // Reverte em caso de erro
    }
    console.error("[Backend ERROR] Erro ao registrar venda:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao registrar venda.",
      error: error.message,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Nova função para buscar o histórico de vendas
async function getHistoricoVendas(req, res) {
  const { cliente, pedido, data } = req.query;

  try {
    let queryBase = `
      SELECT 
        v.id,
        v.cliente_nome as cliente_comprador_nome,
        v.numero_pedido_compra,
        v.data_venda,
        v.valor_total as valor_total_venda,
        v.unidade_gestora as unidade_gestora_venda,
        COALESCE(SUM(inf.quantidade) / 1000.0, 0) as quantidade_total_ton
      FROM vendas v
      LEFT JOIN itens_notas_fiscais inf ON v.id = inf.venda_id
    `;
    
    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (cliente) {
      whereConditions.push(`v.cliente_nome ILIKE $${paramIndex++}`);
      queryParams.push(`%${cliente}%`);
    }
    if (pedido) {
      whereConditions.push(`v.numero_pedido_compra ILIKE $${paramIndex++}`);
      queryParams.push(`%${pedido}%`);
    }
    if (data) {
      whereConditions.push(`v.data_venda = $${paramIndex++}`);
      queryParams.push(data);
    }

    if (whereConditions.length > 0) {
      queryBase += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    queryBase += `
      GROUP BY v.id, v.cliente_nome, v.numero_pedido_compra, v.data_venda, v.valor_total, v.unidade_gestora
      ORDER BY v.id DESC
    `;
    
    const result = await pool.query(queryBase, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('[Controller Error] Erro ao buscar histórico de vendas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// Nova função para gerar relatórios de vendas com filtros
async function getRelatorioVendas(req, res) {
  const { dataInicio, dataFim, clienteId } = req.query;

  try {
    // TENTATIVA DE CORREÇÃO 4: Usando INNER JOIN para garantir que apenas vendas com clientes correspondentes sejam retornadas
    // e adicionando mais proteções no código.
    let query = `
      SELECT 
        v.id, 
        v.cliente_nome,
        v.numero_pedido_compra, 
        v.data_venda, 
        v.valor_total,
        v.unidade_gestora
      FROM vendas AS v
      LEFT JOIN clientes AS c ON TRANSLATE(v.cliente_documento, '.-/', '') = TRANSLATE(c.cnpj, '.-/', '')
      WHERE 1=1`;

    const params = [];
    let paramIndex = 1;

    if (dataInicio) {
      query += ` AND v.data_venda >= $${paramIndex++}`;
      params.push(dataInicio);
    }
    if (dataFim) {
      query += ` AND v.data_venda <= $${paramIndex++}`;
      params.push(dataFim);
    }
    if (clienteId) {
      query += ` AND c.id = $${paramIndex++}`; 
      params.push(clienteId);
    }

    query += ` ORDER BY v.data_venda DESC`;

    const vendasResult = await pool.query(query, params);
    const vendas = vendasResult.rows;

    // CORREÇÃO: Cálculo de totais mais seguro, tratando valores nulos ou inválidos.
    const valorTotalVendido = vendas.reduce((acc, v) => acc + (parseFloat(v.valor_total) || 0), 0);
    const totalVendas = vendas.length;
    
    const contagemClientes = vendas.reduce((acc, v) => {
        if (v.cliente_nome) { // Ignora nomes nulos
            acc[v.cliente_nome] = (acc[v.cliente_nome] || 0) + 1;
        }
        return acc;
    }, {});
    const clientePrincipal = Object.keys(contagemClientes).reduce((a, b) => contagemClientes[a] > contagemClientes[b] ? a : b, null);

    res.status(200).json({
      vendas,
      totais: {
        valorTotalVendido,
        totalVendas,
        clientePrincipal
      }
    });

  } catch (error) {
    console.error('[Controller Error] Erro ao gerar relatório de vendas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

// Nova função para buscar materiais distintos para o filtro
async function getMateriaisDisponiveis(req, res) {
  try {
    // Busca todos os materiais únicos da tabela de itens de nota fiscal, que representa os produtos que podem ser vendidos.
    const query = `
      SELECT DISTINCT 
        material AS nome 
      FROM itens_notas_fiscais 
      WHERE material IS NOT NULL AND material <> '' 
      ORDER BY nome ASC
    `;
    const result = await pool.query(query);
    res.status(200).json({ success: true, materiais: result.rows });
  } catch (error) {
    console.error('[Controller Error] Erro ao buscar materiais disponíveis:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor ao buscar materiais.' });
  }
}

// Nova função para o relatório detalhado de vendas por item
async function getRelatorioDetalhado(req, res) {
  const { 
    dataInicio, 
    dataFim, 
    clienteId, 
    material, 
    unidadeGestora, 
    status, 
    pagina = 1, 
    itensPorPagina = 25, 
    ordenacao = 'data_desc' 
  } = req.query;

  try {
    const commonJoin = `
      FROM vendas AS v
      JOIN itens_notas_fiscais AS inf ON v.id = inf.venda_id
      JOIN notas_fiscais AS nf ON inf.nota_fiscal_id = nf.id
      LEFT JOIN clientes AS c ON v.cliente_documento = c.cnpj
    `;

    const whereConditions = ['inf.venda_id IS NOT NULL'];
    const queryParams = [];
    let paramIndex = 1;

    if (dataInicio) {
      whereConditions.push(`v.data_venda >= $${paramIndex++}`);
      queryParams.push(dataInicio);
    }
    if (dataFim) {
      whereConditions.push(`v.data_venda <= $${paramIndex++}`);
      queryParams.push(dataFim);
    }
    if (clienteId) {
      whereConditions.push(`c.id = $${paramIndex++}`);
      queryParams.push(clienteId);
    }
    if (material) {
      whereConditions.push(`inf.material = $${paramIndex++}`);
      queryParams.push(material);
    }
    if (unidadeGestora) {
      whereConditions.push(`v.unidade_gestora = $${paramIndex++}`);
      queryParams.push(unidadeGestora);
    }
    if (status) {
      whereConditions.push(`nf.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Query de contagem
    const countQuery = `SELECT COUNT(inf.id) as total ${commonJoin} ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalRegistros = parseInt(countResult.rows[0].total, 10);

    // Query principal
    let query = `
      SELECT 
        v.id as venda_id,
        v.data_venda,
        v.cliente_nome,
        v.unidade_gestora,
        v.valor_total as valor_total_venda,
        v.valor_por_tonelada,
        inf.id as item_id,
        inf.material,
        inf.quantidade,
        inf.unidade,
        inf.descricao,
        nf.numero_nota,
        nf.emitente_nome,
        (inf.quantidade / 1000.0) as quantidade_ton,
        v.valor_por_tonelada as valor_unitario,
        (inf.quantidade / 1000.0) * v.valor_por_tonelada as valor_total_item
      ${commonJoin}
      ${whereClause}
    `;

    // Ordenação
    const orderByMap = {
      'data_asc': 'v.data_venda ASC, v.cliente_nome ASC',
      'data_desc': 'v.data_venda DESC, v.cliente_nome ASC',
      'cliente_asc': 'v.cliente_nome ASC, v.data_venda DESC',
      'valor_desc': 'valor_total_item DESC, v.data_venda DESC',
      'valor_asc': 'valor_total_item ASC, v.data_venda DESC',
    };
    query += ` ORDER BY ${orderByMap[ordenacao] || orderByMap['data_desc']}`;

    // Paginação
    const offset = (pagina - 1) * itensPorPagina;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(itensPorPagina, offset);

    const result = await pool.query(query, queryParams);
    
    res.status(200).json({ 
      success: true, 
      itens: result.rows,
      paginacao: {
        pagina_atual: parseInt(pagina, 10),
        itens_por_pagina: parseInt(itensPorPagina, 10),
        total_registros: totalRegistros,
        total_paginas: Math.ceil(totalRegistros / itensPorPagina)
      }
    });

  } catch (error) {
    console.error('[Controller Error] Erro ao gerar relatório detalhado de vendas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor ao gerar relatório.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Nova função para buscar detalhes de uma venda específica
async function getDetalhesVenda(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID da venda é obrigatório.' 
    });
  }

  try {
    // 1. Buscar informações da venda
    const queryVenda = `
      SELECT 
        id,
        cliente_nome,
        cliente_documento,
        valor_total,
        numero_pedido_compra,
        unidade_gestora,
        data_venda,
        observacoes,
        numero_nf_servico,
        cliente_final,
        valor_por_tonelada,
        data_registro
      FROM vendas 
      WHERE id = $1
    `;
    
    const resultVenda = await pool.query(queryVenda, [id]);
    
    if (resultVenda.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venda não encontrada.' 
      });
    }

    const venda = resultVenda.rows[0];

    // 2. Buscar itens da venda
    const queryItens = `
      SELECT 
        inf.id,
        inf.material,
        inf.quantidade,
        (inf.quantidade / 1000.0) as quantidade_ton,
        inf.unidade,
        inf.descricao,
        nf.numero_nota,
        nf.emitente_nome,
        nf.emitente_cnpj,
        nf.data_emissao,
        CASE 
          WHEN inf.material = 'Papel' THEN 800.00
          WHEN inf.material = 'Papelão' THEN 600.00
          WHEN inf.material = 'Vidro' THEN 1200.00
          WHEN inf.material = 'Metal' THEN 1500.00
          WHEN inf.material = 'Plástico' THEN 1000.00
          ELSE 800.00
        END as valor_unitario_estimado,
        (inf.quantidade / 1000.0) * CASE 
          WHEN inf.material = 'Papel' THEN 800.00
          WHEN inf.material = 'Papelão' THEN 600.00
          WHEN inf.material = 'Vidro' THEN 1200.00
          WHEN inf.material = 'Metal' THEN 1500.00
          WHEN inf.material = 'Plástico' THEN 1000.00
          ELSE 800.00
        END as valor_total_item_estimado
      FROM itens_notas_fiscais inf
      JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
      WHERE inf.venda_id = $1
      ORDER BY inf.material, inf.descricao
    `;
    
    const resultItens = await pool.query(queryItens, [id]);
    const itens = resultItens.rows;

    // 3. Calcular totais
    const totalItens = itens.length;
    const totalQuantidade = itens.reduce((sum, item) => sum + parseFloat(item.quantidade_ton || 0), 0);
    const totalValor = parseFloat(venda.valor_total || 0);
    const valorPorTonelada = totalQuantidade > 0 ? totalValor / totalQuantidade : 0;

    // 4. Agrupar por material
    const itensPorMaterial = itens.reduce((acc, item) => {
      if (!acc[item.material]) {
        acc[item.material] = {
          material: item.material,
          quantidade: 0,
          itens: []
        };
      }
      acc[item.material].quantidade += parseFloat(item.quantidade_ton || 0);
      acc[item.material].itens.push(item);
      return acc;
    }, {});

    // Calcular valores proporcionais por material baseado na quantidade
    const totalQuantidadeCalculada = Object.values(itensPorMaterial).reduce((sum, grupo) => sum + grupo.quantidade, 0);
    const valorUnitarioVenda = parseFloat(venda.valor_por_tonelada || 0);
    let somaValoresMateriais = 0;
    Object.values(itensPorMaterial).forEach((grupo, idx, arr) => {
      // Valor total proporcional
      if (totalQuantidadeCalculada > 0) {
        grupo.valor_unitario = valorUnitarioVenda;
        // Para o último material, ajuste para fechar exatamente o valor_total
        if (idx === arr.length - 1) {
          grupo.valor_total = parseFloat((totalValor - somaValoresMateriais).toFixed(2));
        } else {
          grupo.valor_total = parseFloat((grupo.quantidade * valorUnitarioVenda).toFixed(2));
          somaValoresMateriais += grupo.valor_total;
        }
      } else {
        grupo.valor_unitario = 0;
        grupo.valor_total = 0;
      }
      // Corrigir itens internos
      grupo.itens = grupo.itens.map(item => {
        return {
          ...item,
          quantidade_ton: Number(item.quantidade_ton) || 0,
          unidade: 'Ton',
          valor_unitario: valorUnitarioVenda,
          valor_total_item: parseFloat((Number(item.quantidade_ton) * valorUnitarioVenda).toFixed(2))
        };
      });
    });

    res.status(200).json({
      success: true,
      venda: {
        ...venda,
        data_venda_formatada: new Date(venda.data_venda).toLocaleDateString('pt-BR'),
        data_registro_formatada: new Date(venda.data_registro).toLocaleString('pt-BR'),
        valor_por_tonelada: venda.valor_por_tonelada // garantir que venha do banco
      },
      itens: itens,
      itens_por_material: Object.values(itensPorMaterial),
      totais: {
        total_itens: totalItens,
        total_quantidade: totalQuantidade,
        total_valor: totalValor,
        valor_por_tonelada: venda.valor_por_tonelada // garantir que venha do banco
      }
    });

  } catch (error) {
    console.error('[Controller Error] Erro ao buscar detalhes da venda:', error);
    if (error.stack) {
      console.error('[Controller Error] Stack trace:', error.stack);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor ao buscar detalhes da venda.',
      error: process.env.NODE_ENV === 'development' ? (error.stack || error.message) : undefined
    });
  }
}

// Nova função para buscar unidades gestoras
async function getUnidadesGestoras(req, res) {
  try {
    const query = `
      SELECT DISTINCT 
        unidade_gestora 
      FROM vendas 
      WHERE unidade_gestora IS NOT NULL AND unidade_gestora <> '' 
      ORDER BY unidade_gestora ASC
    `;
    const result = await pool.query(query);
    res.status(200).json({ success: true, unidades: result.rows });
  } catch (error) {
    console.error('[Controller Error] Erro ao buscar unidades gestoras:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor ao buscar unidades gestoras.' });
  }
}

// Nova função para buscar métricas de vendas
async function getMetricasVendas(req, res) {
  const { dataInicio, dataFim } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (dataInicio) {
      whereClause += ` AND data_venda >= $${paramIndex++}`;
      params.push(dataInicio);
    }
    if (dataFim) {
      whereClause += ` AND data_venda <= $${paramIndex++}`;
      params.push(dataFim);
    }

    const query = `
      SELECT 
        COUNT(*) as total_vendas,
        COALESCE(SUM(valor_total), 0) as valor_total_vendido,
        COALESCE(AVG(valor_total), 0) as ticket_medio,
        COUNT(DISTINCT cliente_nome) as total_clientes
      FROM vendas 
      ${whereClause}
    `;

    const result = await pool.query(query, params);
    const metricas = result.rows[0];

    res.status(200).json({
      success: true,
      metricas: {
        total_vendas: parseInt(metricas.total_vendas),
        valor_total_vendido: parseFloat(metricas.valor_total_vendido),
        ticket_medio: parseFloat(metricas.ticket_medio),
        total_clientes: parseInt(metricas.total_clientes)
      }
    });
  } catch (error) {
    console.error('[Controller Error] Erro ao buscar métricas de vendas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor ao buscar métricas.' });
  }
}

// Nova função para buscar dados para gráficos
async function getGraficosVendas(req, res) {
  const { dataInicio, dataFim, tipo } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (dataInicio) {
      whereClause += ` AND v.data_venda >= $${paramIndex++}`;
      params.push(dataInicio);
    }
    if (dataFim) {
      whereClause += ` AND v.data_venda <= $${paramIndex++}`;
      params.push(dataFim);
    }

    let query;
    if (tipo === 'vendas_por_periodo') {
      query = `
        SELECT 
          DATE(v.data_venda) as data,
          SUM(v.valor_total) as valor_total
        FROM vendas v
        ${whereClause}
        GROUP BY DATE(v.data_venda)
        ORDER BY data DESC
        LIMIT 30
      `;
    } else if (tipo === 'top_clientes') {
      query = `
        SELECT 
          v.cliente_nome,
          SUM(v.valor_total) as valor_total
        FROM vendas v
        ${whereClause}
        GROUP BY v.cliente_nome
        ORDER BY valor_total DESC
        LIMIT 10
      `;
    } else if (tipo === 'vendas_por_material') {
      query = `
        SELECT 
          inf.material,
          SUM(inf.quantidade) as quantidade_total,
          SUM((inf.quantidade / 1000.0) * CASE 
            WHEN inf.material = 'Papel' THEN 800.00
            WHEN inf.material = 'Papelão' THEN 600.00
            WHEN inf.material = 'Vidro' THEN 1200.00
            WHEN inf.material = 'Metal' THEN 1500.00
            WHEN inf.material = 'Plástico' THEN 1000.00
            ELSE 800.00
          END) as valor_total
        FROM vendas v
        JOIN notas_fiscais nf ON v.numero_pedido_compra = nf.numero_pedido_compra
        JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
        ${whereClause}
        GROUP BY inf.material
        ORDER BY valor_total DESC
        LIMIT 10
      `;
    } else {
      return res.status(400).json({ success: false, message: 'Tipo de gráfico inválido.' });
    }

    const result = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      dados: result.rows
    });
  } catch (error) {
    console.error('[Controller Error] Erro ao buscar dados para gráficos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor ao buscar dados para gráficos.' });
  }
}

module.exports = {
  registrarVenda,
  getHistoricoVendas,
  getRelatorioVendas,
  getMateriaisDisponiveis,
  getRelatorioDetalhado,
  getDetalhesVenda,
  getUnidadesGestoras,
  getMetricasVendas,
  getGraficosVendas,
};
