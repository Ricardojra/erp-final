const pool = require('../config/dbConfig');

/**
 * Consulta notas fiscais disponíveis para formação de lote.
 * Busca notas com status 'disponivel' que correspondam ao material.
 * A lógica de quantidade será tratada no frontend ou em uma próxima iteração.
 */
async function consultarNotasDisponiveis(req, res) {
  const { material, clienteId, ano, quantidade } = req.query;

  if (!material || !clienteId || !ano || !quantidade) {
    return res.status(400).json({ success: false, message: 'Material, cliente prioritário, ano e quantidade são obrigatórios.' });
  }

  try {
    // 1. Buscar notas do cliente prioritário
    const queryPrioritario = `
      SELECT 
        nf.id, 
        inf.id as item_id,
        nf.numero_nota AS "numeroNF",
        nf.data_emissao AS "dataEmissao",
        nf.emitente_nome AS "emitenteNome",
        inf.material AS "material",
        inf.quantidade::float AS "quantidade",
        nf.cliente_id
      FROM notas_fiscais nf
      JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
      WHERE nf.status = 'disponivel' AND UPPER(inf.material) = UPPER($1) AND nf.cliente_id = $2 AND EXTRACT(YEAR FROM nf.data_emissao) = $3
      ORDER BY nf.data_emissao ASC;
    `;
    const resultPrioritario = await pool.query(queryPrioritario, [material, clienteId, ano]);
    let notasSelecionadas = [];
    let soma = 0;
    const limite = parseFloat(quantidade) * 1.05;
    for (const nota of resultPrioritario.rows) {
      if (soma >= quantidade) break;
      if (soma > 0 && soma + nota.quantidade > limite) break;
      notasSelecionadas.push(nota);
      soma += nota.quantidade;
    }
    // Se atingiu a quantidade, retorna
    if (soma >= quantidade) {
      return res.status(200).json({ success: true, notas: notasSelecionadas });
    }
    // 2. Buscar em outros clientes se necessário
    const queryOutros = `
      SELECT 
        nf.id, 
        inf.id as item_id,
        nf.numero_nota AS "numeroNF",
        nf.data_emissao AS "dataEmissao",
        nf.emitente_nome AS "emitenteNome",
        inf.material AS "material",
        inf.quantidade::float AS "quantidade",
        nf.cliente_id
      FROM notas_fiscais nf
      JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
      WHERE nf.status = 'disponivel' AND UPPER(inf.material) = UPPER($1) AND nf.cliente_id <> $2 AND EXTRACT(YEAR FROM nf.data_emissao) = $3
      ORDER BY nf.data_emissao ASC;
    `;
    const resultOutros = await pool.query(queryOutros, [material, clienteId, ano]);
    for (const nota of resultOutros.rows) {
      if (soma >= quantidade) break;
      if (soma > 0 && soma + nota.quantidade > limite) break;
      notasSelecionadas.push(nota);
      soma += nota.quantidade;
    }
    if (notasSelecionadas.length === 0 || soma < quantidade) {
      return res.status(200).json({ success: false, message: 'Não foi possível encontrar notas suficientes para atingir a quantidade desejada.' });
    }
    return res.status(200).json({ success: true, notas: notasSelecionadas });
  } catch (error) {
    console.error('[lotesController.js] Erro ao consultar notas fiscais disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor.',
      error: process.env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : undefined
    });
  }
}

/**
 * Cria um novo lote com as notas fiscais selecionadas.
 */
async function criarLote(req, res) {
  const { unidadeGestora, notasIds } = req.body;

  if (!unidadeGestora || !notasIds || notasIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Unidade gestora e IDs das notas são obrigatórios.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Etapa 1: Criar o registro do lote na (futura) tabela 'lotes'
    // Por enquanto, vamos apenas simular a criação e focar em atualizar as notas.
    const loteNumero = `LOTE-${Date.now()}`;
    console.log(`[lotesController.js] Criando lote ${loteNumero} para a unidade ${unidadeGestora}`);

    // Etapa 2: Atualizar o status das notas fiscais para 'em_lote'
    const updateQuery = `
      UPDATE notas_fiscais
      SET status = 'em_lote', lote_associado = $1
      WHERE id = ANY($2::int[])
    `;
    
    await client.query(updateQuery, [loteNumero, notasIds]);

    await client.query('COMMIT');

    res.status(201).json({ success: true, message: 'Lote criado com sucesso!', loteNumero });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[lotesController.js] Erro ao criar lote:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao criar o lote.' });
  } finally {
    client.release();
  }
}

/**
 * Retorna clientes com notas disponíveis para determinado material e ano (ou todos os anos)
 */
async function clientesPorMaterialEAno(req, res) {
  const { material, ano } = req.query;
  if (!material) {
    return res.status(400).json({ success: false, message: 'Material é obrigatório.' });
  }
  try {
    let query = `
      SELECT DISTINCT nf.cliente_id, nf.emitente_nome
      FROM notas_fiscais nf
      JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
      WHERE nf.status = 'disponivel' AND UPPER(inf.material) = UPPER($1)
    `;
    const params = [material];
    if (ano && ano !== 'Todos') {
      query += ' AND EXTRACT(YEAR FROM nf.data_emissao) = $2';
      params.push(ano);
    }
    query += ' ORDER BY nf.emitente_nome ASC';
    const result = await pool.query(query, params);
    res.status(200).json({ success: true, clientes: result.rows });
  } catch (error) {
    console.error('[lotesController.js] Erro ao buscar clientes por material/ano:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao buscar clientes.' });
  }
}

module.exports = {
  consultarNotasDisponiveis,
  criarLote,
  clientesPorMaterialEAno,
};
