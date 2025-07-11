// Importa o módulo 'pool' para gerenciar a conexão com o banco de dados PostgreSQL.
const pool = require("../config/dbConfig");
// Importa 'xml2js' para parsear o conteúdo XML recebido, caso seja necessário parsear novamente no backend.
const xml2js = require("xml2js");


// Cria uma instância do parser XML para ser usada na função importarXml.
const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

// Função auxiliar para normalizar nomes de materiais: remove acentos, converte para minúsculas e remove o plural.
const normalizeMaterialName = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  let normalized = str
    .normalize('NFD') // Decompõe os caracteres acentuados (ex: 'á' -> 'a' + '´')
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
    .toLowerCase(); // Converte para minúsculas

  // Remove o 's' do plural no final da string, se houver
  if (normalized.endsWith('s')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
};

// ==============================================================================
// FUNÇÃO AUXILIAR: sendErrorResponse
// Reutilizada para padronizar as respostas de erro em todas as funções do controlador.
// ==============================================================================
/**
 * Envia uma resposta de erro padronizada.
 * @param {object} res - O objeto de resposta do Express.
 * @param {number} status - O código de status HTTP do erro (e.g., 400, 404, 500).
 * @param {string} message - Uma mensagem descritiva do erro para o cliente.
 * @param {Error} [error=null] - O objeto de erro original para logar detalhes no servidor.
 */
const sendErrorResponse = (res, status, message, error = null) => {
  // Loga o erro completo no console do servidor, incluindo stack trace em modo de desenvolvimento.
  console.error(
    `[Controller Error] ${message}`,
    error ? { message: error.message, stack: error.stack } : {}
  );
  // Envia a resposta JSON para o cliente.
  res.status(status).json({
    success: false, // Indica que a operação falhou.
    message, // Mensagem amigável para o cliente.
    // Inclui detalhes do erro (stack trace) apenas em ambiente de desenvolvimento para segurança.
    error:
      process.env.NODE_ENV === "development" && error
        ? { message: error.message, stack: error.stack }
        : undefined, // 'undefined' para não enviar em produção.
  });
};

// --- FUNÇÃO AUXILIAR: getClassificacaoNCM ---
// Busca a classificação de material para um NCM específico no banco de dados.
const getClassificacaoNCM = async (ncm) => {
  if (!ncm) {
    console.warn("[getClassificacaoNCM] Tentativa de classificar um NCM nulo ou vazio.");
    return null;
  }
  try {
    const query = "SELECT tipo_material FROM classificacao_ncm WHERE ncm = $1";
    const result = await pool.query(query, [ncm]);

    if (result.rows.length > 0) {
      return result.rows[0].tipo_material;
    } else {
      console.warn(`[getClassificacaoNCM] NCM não encontrado no banco de dados: ${ncm}`);
      return null; // Retorna nulo se não encontrar, para ser tratado na função chamadora.
    }
  } catch (error) {
    console.error(`[getClassificacaoNCM] Erro ao consultar o NCM ${ncm}:`, error);
    throw new Error("Erro ao consultar a classificação do NCM."); // Lança um erro para interromper a transação.
  }
};

// ==============================================================================
// FUNÇÃO PRINCIPAL: importarXml
// Lida com a importação de uma Nota Fiscal XML para o banco de dados.
// Recebe os dados da nota fiscal e o conteúdo XML bruto do frontend.
// ==============================================================================
/**
 * Processa a importação de uma Nota Fiscal XML.
 * Realiza validação de duplicidade e insere a nota e seus itens no banco de dados.
 * @param {object} req - O objeto de requisição do Express, contendo os dados da nota no corpo (body).
 * @param {object} res - O objeto de resposta do Express.
 */
const importarXml = async (req, res) => {
  // Extrai os dados da nota fiscal do corpo da requisição.
  // Estes dados já foram pré-processados e extraídos do XML pelo frontend.
  const {
    chaveNFe,
    numeroNota,
    dataEmissao,
    emitenteCNPJ,
    emitenteNome,
    emitenteUF,
    destinatarioCNPJ,
    destinatarioNome,
    destinatarioUF,
    itens,
    //xmlContent, // Conteúdo XML bruto enviado pelo frontend.
    unidadeGestora, // Adicionei a unidadeGestora, que estava em versões anteriores
  } = req.body;

  // Validação básica dos dados recebidos.
  if (
    !chaveNFe ||
    !numeroNota ||
    !dataEmissao ||
    !emitenteCNPJ ||
    !emitenteNome ||
    !destinatarioCNPJ ||
    !destinatarioNome ||
    !itens ||
    itens.length === 0 ||
   // !xmlContent ||
    !unidadeGestora // Valida que a unidade gestora foi fornecida
  ) {
    console.warn(
      "[importarXml] Dados essenciais faltando na requisição:",
      req.body
    );
    return sendErrorResponse(
      res,
      400,
      "Dados essenciais da nota fiscal faltando."
    );
  }

  // Inicia uma transação de banco de dados para garantir atomicidade.
  // Se qualquer parte da operação falhar, tudo é revertido.
  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // Inicia a transação.

    // 1. VERIFICAÇÃO DE DUPLICIDADE:
    // Tenta encontrar uma nota fiscal existente usando a chave da NF-e.
    const checkDuplicateQuery = `
      SELECT id FROM notas_fiscais WHERE chave_nfe = $1;
    `;
    const duplicateResult = await client.query(checkDuplicateQuery, [chaveNFe]);

    if (duplicateResult.rows.length > 0) {
      // Se a chave da NF-e já existe, retorna um status 409 (Conflict).
      // Isso indica ao frontend que a nota já foi importada.
      await client.query("ROLLBACK"); // Reverte quaisquer operações pendentes (embora não haja neste ponto).
      console.log(`[importarXml] Nota fiscal duplicada detectada: ${chaveNFe}`);
      return res.status(409).json({
        success: false,
        message: `Nota fiscal com chave ${chaveNFe} já existe no banco de dados.`,
        status: "duplicate", // Status customizado para o frontend exibir a mensagem correta.
      });
    }

    // 2. INSERÇÃO DA NOTA FISCAL PRINCIPAL:
    const insertNotaQuery = `
      INSERT INTO notas_fiscais (
        chave_nfe, numero_nota, data_emissao, emitente_cnpj, emitente_nome, emitente_uf,
        destinatario_cnpj, destinatario_nome, destinatario_uf, status, unidade_gestora
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id; -- Retorna o ID da nova nota fiscal inserida.
    `;
    const notaResult = await client.query(insertNotaQuery, [
      chaveNFe,
      numeroNota,
      dataEmissao,
      emitenteCNPJ,
      emitenteNome,
      emitenteUF,
      destinatarioCNPJ,
      destinatarioNome,
      destinatarioUF,
      //xmlContent, // Salva o XML bruto no banco de dados.
      "disponivel", // Define o status inicial da nota como 'pendente'.
      unidadeGestora, // Salva a unidade gestora
    ]);
    const notaFiscalId = notaResult.rows[0].id; // Pega o ID da nota recém-inserida.

    // 3. INSERÇÃO DOS ITENS DA NOTA FISCAL (COM CLASSIFICAÇÃO DE MATERIAL):
    for (const item of itens) {
      if (!item.ncm || !item.descricao || !item.quantidade || !item.unidade) {
        console.warn(
          "[importarXml] Dados de item faltando para a nota:",
          item
        );
        throw new Error("Dados de um item da nota fiscal estão incompletos.");
      }

      // Classifica o material com base no NCM usando a função auxiliar.
      const material = await getClassificacaoNCM(item.ncm);
      if (!material) {
        // Se o NCM não for classificado, a importação da nota falha para garantir a integridade.
        throw new Error(
          `O NCM ${item.ncm} do item '${item.descricao}' não pôde ser classificado. Verifique o cadastro de NCMs.`
        );
      }

      // Garante que o campo opcional CFOP tenha um valor padrão.
      const cfop = item.cfop || null; // Se cfop não existir, usa null.

      const insertItemQuery = `
        INSERT INTO itens_notas_fiscais (
          nota_fiscal_id, ncm, descricao, quantidade, unidade, material, cfop
        ) VALUES ($1, $2, $3, $4, $5, $6, $7);
      `;
      await client.query(insertItemQuery, [
        notaFiscalId,
        item.ncm,
        item.descricao,
        item.quantidade,
        item.unidade,
        material,
        cfop,
      ]);
    }

    await client.query("COMMIT"); // Confirma a transação se todas as operações foram bem-sucedidas.
    console.log(`[importarXml] Nota fiscal ${chaveNFe} importada com sucesso.`);
    // Envia uma resposta de sucesso para o frontend.
    res.status(200).json({
      success: true,
      message: `Nota fiscal ${chaveNFe} importada com sucesso!`,
      status: "success", // Status customizado para o frontend.
      notaFiscalId: notaFiscalId,
    });
  } catch (error) {
    await client.query("ROLLBACK"); // Em caso de erro, reverte todas as operações da transação.
    sendErrorResponse(
      res,
      500,
      "Erro interno do servidor ao importar nota fiscal.",
      error
    );
  } finally {
    client.release(); // Libera o cliente do pool de conexões.
  }
};

// ==============================================================================
// FUNÇÃO: getStatusCounts
// Busca a contagem de notas fiscais agrupadas por seus status.
// ==============================================================================
/**
 * Retorna a contagem de notas fiscais por status.
 * @param {object} req - O objeto de requisição do Express.
 * @param {object} res - O objeto de resposta do Express.
 */
const getStatusCounts = async (req, res) => {
  try {
    const query = `
      SELECT
        status,
        COUNT(*) as count
      FROM notas_fiscais
      GROUP BY status;
    `;
    const result = await pool.query(query);

    // Transforma o array de resultados em um objeto de contagens, que é o formato
    // esperado pelo frontend. Ex: { disponivel: 10, enviada: 5, ... }
    const counts = result.rows.reduce((acc, row) => {
      if (row.status && typeof row.status === 'string') {
        acc[row.status] = parseInt(row.count, 10) || 0;
      }
      return acc;
    }, {});

    // Garante que todos os status esperados pelo frontend existam no objeto final,
    // mesmo que a contagem seja 0 e não venha do banco de dados.
    const allStatuses = ['disponivel', 'enviada', 'vendida', 'reprovada', 'pendente', 'ofertada'];
    allStatuses.forEach(status => {
      if (!counts.hasOwnProperty(status)) {
        counts[status] = 0;
      }
    });

    res.json({ success: true, counts });
  } catch (error) {
    // Em caso de erro, usa a função auxiliar para enviar uma resposta padronizada.
    sendErrorResponse(
      res,
      500,
      "Erro interno ao buscar contagem de status",
      error
    );
  }
};

// ==============================================================================
// FUNÇÃO: getNotasVendidas
// Busca notas fiscais com status 'vendida' para exibir em relatórios/dashboards.
// ==============================================================================
/**
 * Retorna uma lista de notas fiscais com o status 'vendida'.
 * Inclui campos como número da nota, destinatário e data de emissão.
 * @param {object} req - O objeto de requisição do Express.
 * @param {object} res - O objeto de resposta do Express.
 */
const getNotasVendidas = async (req, res) => {
  try {
    const query = `
      SELECT
        numero_nota,
        destinatario_nome,
        data_emissao
      FROM notas_fiscais
      WHERE status = 'vendida'
      ORDER BY data_emissao DESC;
    `;
    const result = await pool.query(query);

    // Mapeia os resultados para adicionar campos fictícios (se necessário para demonstração).
    const notasComValorFicticio = result.rows
      .map((nota) => {
        // Validação básica para garantir que os dados estão completos.
        if (!nota.numero_nota || !nota.data_emissao) {
          console.warn("[getNotasVendidas] Nota inválida encontrada:", nota);
          return null; // Ignora notas incompletas.
        }
        return {
          numero_nota: nota.numero_nota,
          destinatario_nome: nota.destinatario_nome || "Não informado", // Trata caso o nome do destinatário seja nulo.
          data_emissao: nota.data_emissao,
          por_quanto_foi_vendida: "R$ 123,45", // Exemplo de valor fictício para demonstração.
          quando_foi_vendida: nota.data_emissao,
        };
      })
      .filter((item) => item !== null); // Filtra notas inválidas.

    res.json({ success: true, notas_vendidas: notasComValorFicticio });
  } catch (error) {
    sendErrorResponse(res, 500, "Erro interno ao buscar notas vendidas", error);
  }
};

// ==============================================================================
// FUNÇÃO: getMateriaisPorStatus
// Agrupa e soma quantidades de materiais por seu status nas notas fiscais.
// ==============================================================================
/**
 * Agrupa materiais por status de nota fiscal e soma suas quantidades.
 * Útil para um inventário agregado por status (e.g., disponível, vendido).
 * @param {object} req - O objeto de requisição do Express.
 * @param {object} res - O objeto de resposta do Express.
 */
const getMateriaisPorStatus = async (req, res) => {
  try {
    // Consulta SQL que une 'itens_notas_fiscais' com 'notas_fiscais' para obter o status.
    const query = `
      SELECT
        inf.material,
        nf.status,
        SUM(inf.quantidade) as total
      FROM itens_notas_fiscais inf
      JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
      GROUP BY inf.material, nf.status
      ORDER BY inf.material, nf.status;
    `;
    const result = await pool.query(query);

    // Objeto para armazenar a resposta final, formatada por material e status.
    const response = {};
    // Lista de status permitidos para validação.
    const statusPermitidos = [
      "disponivel",
      "enviada",
      "vendida",
      "reprovada",
      "pendente",
      "ofertada",
    ];

    // Processa cada linha retornada do banco de dados.
    result.rows.forEach(({ material, status, total }) => {
      // Validações para garantir a integridade dos dados antes de processar.
      if (!material || typeof material !== "string") {
        console.warn(
          "[getMateriaisPorStatus] Material inválido encontrado:",
          material
        );
        return; // Ignora linhas com material inválido.
      }
      if (!status || !statusPermitidos.includes(status.toLowerCase())) {
        console.warn(
          "[getMateriaisPorStatus] Status inválido ou não permitido:",
          status
        );
        return; // Ignora linhas com status inválido ou não permitido.
      }
      if (isNaN(parseFloat(total))) {
        console.warn(
          "[getMateriaisPorStatus] Total inválido para material/status:",
          { material, status, total }
        );
        return; // Ignora linhas com total inválido.
      }

            const mat = normalizeMaterialName(material); // Normaliza o nome do material para consistência.
      const stat = status.toLowerCase(); // Normaliza o status.

      // Inicializa o objeto para o material se ele ainda não existir na resposta.
      if (!response[mat]) {
        response[mat] = {
          disponivel: 0,
          enviada: 0,
          vendida: 0,
          reprovada: 0,
          pendente: 0,
          ofertada: 0,
        };
      }

      // Adiciona a quantidade ao status correspondente do material.
      response[mat][stat] += parseFloat(total);
    });

    // Itera sobre cada material na resposta para calcular o total.
    for (const material in response) {
      if (response.hasOwnProperty(material)) {
        // Soma os valores de todos os status para obter o total do material.
        const total = Object.values(response[material]).reduce(
          (sum, current) => sum + current,
          0
        );
        // Adiciona a propriedade 'total' ao objeto do material.
        response[material].total = total;
      }
    }

    console.log(
      "[getMateriaisPorStatus] Dados de materiais por status processados. Total de materiais únicos:",
      Object.keys(response).length
    );
    res.json(response);
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Erro interno ao consultar materiais por status",
      error
    );
  }
};

// ==============================================================================
// FUNÇÃO: getNotasByCliente
// Busca notas fiscais com base no nome do cliente e opcionalmente no ano.
// ==============================================================================
/**
 * Busca notas fiscais por nome de cliente (emitente ou destinatário) e opcionalmente por ano de emissão.
 * @param {object} req - O objeto de requisição do Express, contendo `clienteNome` nos parâmetros e `year` na query.
 * @param {object} res - O objeto de resposta do Express.
 */
const getNotasByCliente = async (req, res) => {
  // Extrai o nome do cliente dos parâmetros da URL e o ano da query string.
  const { clienteNome } = req.params;
  const { year } = req.query;

  // Validação: o nome do cliente é obrigatório.
  if (!clienteNome) {
    return sendErrorResponse(res, 400, "Nome do cliente é obrigatório.");
  }

  try {
    // Query SQL base para buscar notas, unindo com itens para detalhes.
    let query = `
      SELECT
        nf.id,
        nf.numero_nota,
        nf.data_emissao,
        nf.emitente_nome,
        nf.destinatario_nome,
        nf.status,
        nf.unidade_gestora,
        inf.material,
        inf.quantidade,
        inf.descricao
      FROM notas_fiscais nf
      LEFT JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
      WHERE (nf.destinatario_nome ILIKE $1 OR nf.emitente_nome ILIKE $1)
    `;
    const params = [`%${clienteNome}%`]; // Parâmetro para o nome do cliente (case-insensitive).
    let paramIndex = 2; // Índice para os próximos parâmetros, começando após $1.

    // Adiciona o filtro de ano se um ano específico for fornecido e não for "all".
    if (year && year !== "all") {
      query += ` AND EXTRACT(YEAR FROM nf.data_emissao) = $${paramIndex}`;
      params.push(parseInt(year)); // Adiciona o ano como parâmetro.
    }

    // Adiciona ordenação para os resultados.
    query += ` ORDER BY nf.data_emissao DESC, nf.numero_nota ASC;`;

    console.log(
      `[getNotasByCliente] Executando query para cliente: '${clienteNome}' (Ano: ${
        year || "Todos"
      })`
    );
    // Executa a query no banco de dados.
    const { rows } = await pool.query(query, params);

    console.log(
      `[getNotasByCliente] ${
        rows.length
      } notas encontradas para '${clienteNome}' (Ano: ${year || "Todos"}).`
    );
    res.json({ success: true, notas: rows });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Erro interno do servidor ao buscar notas por nome do cliente.",
      error
    );
  }
};

// ==============================================================================
// FUNÇÃO: getNotasByNumeros
// Busca notas fiscais por uma lista de números de notas.
// ==============================================================================
/**
 * Busca notas fiscais com base em uma lista de números de notas fornecidos.
 * @param {object} req - O objeto de requisição do Express, contendo `numeros_notas` na query string.
 * @param {object} res - O objeto de resposta do Express.
 */
const getNotasByNumeros = async (req, res) => {
  try {
    const { numeros_notas } = req.query; // Pega a string de números de notas da query param.

    // Validação: 'numeros_notas' é obrigatório.
    if (!numeros_notas) {
      return sendErrorResponse(
        res,
        400,
        "Parâmetro 'numeros_notas' é obrigatório."
      );
    }
    // Converte a string de números (separados por vírgula) em um array de strings.
    const numerosArray = numeros_notas
      .split(",")
      .map((n) => n.trim()) // Remove espaços em branco.
      .filter((n) => n); // Remove entradas vazias.

    // Validação: verifica se há números de nota válidos no array.
    if (numerosArray.length === 0) {
      return sendErrorResponse(
        res,
        400,
        "Nenhum número de nota válido fornecido."
      );
    }

    // Query SQL para selecionar notas onde o 'numero_nota' está no array fornecido.
    const query = `
      SELECT
        nf.id,
        nf.numero_nota,
        nf.data_emissao,
        nf.emitente_nome,
        nf.destinatario_nome,
        nf.status,
        nf.unidade_gestora,
        inf.material,
        inf.quantidade,
        inf.descricao,
        inf.id AS item_nota_fiscal_id
      FROM notas_fiscais nf
      LEFT JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
      WHERE nf.numero_nota = ANY($1::text[]) -- Usa o operador ANY para comparar com um array de texto.
      ORDER BY nf.data_emissao DESC;
    `;
    // Executa a query, passando o array de números como um único parâmetro.
    const { rows } = await pool.query(query, [numerosArray]);
    res.json({ success: true, notas: rows });
  } catch (error) {
    sendErrorResponse(res, 500, "Erro ao buscar notas por números.", error);
  }
};

// ==============================================================================
// FUNÇÃO: updateNotaStatus
// Atualiza o status de uma nota fiscal específica pelo seu ID.
// ==============================================================================
/**
 * Atualiza o status de uma nota fiscal.
 * @param {object} req - O objeto de requisição do Express, contendo o ID da nota nos parâmetros e o novo status no corpo.
 * @param {object} res - O objeto de resposta do Express.
 */
const updateNotaStatus = async (req, res) => {
  // Extrai o ID da nota dos parâmetros da URL e o novo status do corpo da requisição.
  const { id } = req.params;
  const { status } = req.body;

  // Validação: ID da nota e status são obrigatórios.
  if (!id || !status) {
    return sendErrorResponse(
      res,
      400,
      "ID da nota e novo status são obrigatórios."
    );
  }

  // Lista de status permitidos para evitar valores inválidos.
  const statusPermitidos = [
    "disponivel",
    "enviada",
    "vendida",
    "reprovada",
    "pendente",
    "ofertada",
  ];
  // Validação: verifica se o status fornecido é permitido.
  if (!statusPermitidos.includes(status)) {
    return sendErrorResponse(
      res,
      400,
      `Status inválido: '${status}'. Status permitidos: ${statusPermitidos.join(
        ", "
      )}`
    );
  }

  try {
    // Query SQL para atualizar o status da nota fiscal.
    // RETURNING id, status, numero_nota; - Retorna os dados da linha atualizada.
    const query = `
      UPDATE notas_fiscais
      SET status = $1
      WHERE id = $2
      RETURNING id, status, numero_nota;
    `;
    const { rows } = await pool.query(query, [status, id]);

    // Se nenhuma linha foi afetada, a nota fiscal com o ID fornecido não foi encontrada.
    if (rows.length === 0) {
      return sendErrorResponse(res, 404, "Nota fiscal não encontrada.");
    }

    // Resposta de sucesso com os dados da nota atualizada.
    res.json({
      success: true,
      message: "Status da nota atualizado com sucesso.",
      updatedNota: rows[0],
    });
  } catch (error) {
    sendErrorResponse(res, 500, "Erro ao atualizar status da nota.", error);
  }
};

// ==============================================================================
// FUNÇÃO: getAvailableYears
// Busca todos os anos distintos de emissão de notas fiscais no banco de dados.
// ==============================================================================
/**
 * Retorna uma lista de todos os anos distintos de emissão de notas fiscais presentes no banco de dados.
 * @param {object} req - O objeto de requisição do Express.
 * @param {object} res - O objeto de resposta do Express.
 */
const getAvailableYears = async (req, res) => {
  try {
    // Query SQL para extrair anos distintos da coluna 'data_emissao'.
    const query = `
      SELECT DISTINCT EXTRACT(YEAR FROM data_emissao) AS year
      FROM notas_fiscais
      WHERE data_emissao IS NOT NULL -- Ignora entradas com data de emissão nula.
      ORDER BY year DESC; -- Ordena os anos em ordem decrescente.
    `;
    const { rows } = await pool.query(query);
    // Mapeia os resultados para um array de números inteiros, filtrando quaisquer valores não numéricos.
    const years = rows
      .map((row) => parseInt(row.year))
      .filter((year) => !isNaN(year)); // Garante que apenas números válidos sejam retornados.
    res.json({ success: true, years });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Erro interno ao buscar anos disponíveis para notas fiscais.",
      error
    );
  }
};

// ==============================================================================
// FUNÇÃO: getNotasDisponiveisParaVenda
// Busca notas fiscais e seus itens com status 'disponivel' ou 'ofertada'.
// ==============================================================================
/**
 * Busca notas fiscais e seus itens que estão com status 'disponivel' ou 'ofertada'.
 * Permite filtrar por número de nota e status específico.
 * @param {object} req - O objeto de requisição do Express, com `numero_nota` e `status` na query.
 * @param {object} res - O objeto de resposta do Express.
 */
const getNotasDisponiveisParaVenda = async (req, res) => {
  const { numero_nota, status } = req.query;
  try {
    let query = `
      SELECT
        nf.id AS nota_fiscal_id,
        nf.numero_nota,
        nf.data_emissao,
        nf.emitente_nome,
        nf.destinatario_nome,
        nf.unidade_gestora,
        nf.status,
        inf.id AS item_nota_fiscal_id,
        inf.ncm,
        inf.descricao,
        inf.quantidade,
        inf.unidade,
        inf.material
      FROM notas_fiscais nf
      JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
      WHERE nf.status IN ('disponivel', 'ofertada')
    `;
    const params = [];
    let paramIndex = 1;

    if (numero_nota) {
      query += ` AND nf.numero_nota ILIKE $${paramIndex}`;
      params.push(`%${numero_nota}%`);
      paramIndex++;
    }

    // Se o status for fornecido, filtra por ele (mantendo os status de 'disponivel'/'ofertada' primários)
    if (
      status &&
      [
        "disponivel",
        "ofertada",
        "pendente",
        "vendida",
        "reprovada",
        "enviada",
      ].includes(status.toLowerCase())
    ) {
      query += ` AND nf.status = $${paramIndex}`;
      params.push(status.toLowerCase());
      paramIndex++;
    }

    query += ` ORDER BY nf.data_emissao DESC, nf.numero_nota ASC;`;
    console.log(
      "[getNotasDisponiveisParaVenda] Buscando notas disponíveis com query:",
      query,
      "params:",
      params
    );
    const { rows } = await pool.query(query, params);

    res.json({ success: true, notas: rows });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Erro interno ao buscar notas disponíveis para venda.",
      error
    );
  }
};

// ==============================================================================
// FUNÇÃO: registrarVenda
// Registra uma nova transação de venda e atualiza o status das notas fiscais.
// ==============================================================================
/**
 * Registra uma nova transação de venda e atualiza o status das notas fiscais e itens envolvidos.
 * @param {object} req - O objeto de requisição do Express, com os dados da venda no corpo.
 * @param {object} res - O objeto de resposta do Express.
 */
const registrarVenda = async (req, res) => {
  const {
    clienteCompradorNome,
    clienteCompradorDocumento,
    valorTotalVenda,
    numeroPedidoCompra,
    unidadeGestoraVenda,
    dataVenda,
    observacoes,
    itensVendidos,
  } = req.body;

  // Validação básica
  if (
    !clienteCompradorNome ||
    !valorTotalVenda ||
    !dataVenda ||
    !unidadeGestoraVenda ||
    !itensVendidos ||
    itensVendidos.length === 0
  ) {
    return sendErrorResponse(
      res,
      400,
      "Dados da venda incompletos. Cliente, valor, data, unidade gestora e itens vendidos são obrigatórios."
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // Inicia a transação

    // 1. Inserir a transação de venda principal
    const insertVendaQuery = `
      INSERT INTO vendas (
        data_venda, cliente_comprador_nome, cliente_comprador_documento,
        valor_total_venda, numero_pedido_compra, unidade_gestora_venda, observacoes, usuario_registro
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
    `;
    const vendaResult = await client.query(insertVendaQuery, [
      dataVenda,
      clienteCompradorNome,
      clienteCompradorDocumento,
      valorTotalVenda,
      numeroPedidoCompra,
      unidadeGestoraVenda,
      observacoes,
      "usuario_logado_placeholder", // TODO: Substituir por um mecanismo real de usuário logado
    ]);
    const vendaId = vendaResult.rows[0].id;

    const notasFiscaisIdsToUpdate = new Set(); // Para atualizar o status da NF uma única vez

    // 2. Inserir os itens vendidos e atualizar o status das notas fiscais
    for (const item of itensVendidos) {
      if (
        !item.item_nota_fiscal_id ||
        !item.quantidade ||
        !item.nota_fiscal_id ||
        !item.numero_nota_origem
      ) {
        throw new Error(
          "Dados de item vendido incompletos (item_nota_fiscal_id, quantidade, nota_fiscal_id, numero_nota_origem são obrigatórios)."
        );
      }

      // Consulta o item original da NF para obter NCM, descrição, etc.
      const originalItemQuery = `
        SELECT ncm, descricao, quantidade, unidade, material
        FROM itens_notas_fiscais
        WHERE id = $1;
      `;
      const originalItemResult = await client.query(originalItemQuery, [
        item.item_nota_fiscal_id,
      ]);

      if (originalItemResult.rows.length === 0) {
        throw new Error(
          `Item da nota fiscal original ID ${item.item_nota_fiscal_id} não encontrado.`
        );
      }
      const originalItem = originalItemResult.rows[0];

      // Inserir o item na tabela 'itens_de_venda'
      const insertItemVendaQuery = `
        INSERT INTO itens_de_venda (
          venda_id, nota_fiscal_id, item_nota_fiscal_id, numero_nota_origem, ncm, descricao,
          quantidade, unidade, material, valor_unitario_item_venda, valor_total_item_venda
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
      `;

      const valorUnitario = item.valor_unitario_venda || 0;
      const valorTotalItem =
        item.valor_total_item_venda || item.quantidade * valorUnitario;

      await client.query(insertItemVendaQuery, [
        vendaId,
        item.nota_fiscal_id,
        item.item_nota_fiscal_id,
        item.numero_nota_origem,
        originalItem.ncm,
        originalItem.descricao,
        item.quantidade,
        originalItem.unidade,
        originalItem.material,
        valorUnitario,
        valorTotalItem,
      ]);
      // Adiciona o ID da nota fiscal para atualização de status
      notasFiscaisIdsToUpdate.add(item.nota_fiscal_id);
    }

    // 3. Atualizar o status das notas fiscais envolvidas para 'vendida'
    if (notasFiscaisIdsToUpdate.size > 0) {
      const notaIdsArray = Array.from(notasFiscaisIdsToUpdate);
      const updateNotaStatusQuery = `
        UPDATE notas_fiscais
        SET status = 'vendida'
        WHERE id = ANY($1::int[]);
      `;
      await client.query(updateNotaStatusQuery, [notaIdsArray]);
    }

    await client.query("COMMIT");
    console.log(
      `[registrarVenda] Venda #${vendaId} registrada com sucesso. Pedido: ${
        numeroPedidoCompra || "N/A"
      }. Unidade Gestora: ${unidadeGestoraVenda}.`
    );
    res.status(200).json({
      success: true,
      message: "Venda de materiais registrada com sucesso!",
      vendaId: vendaId,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    sendErrorResponse(res, 500, "Erro ao registrar venda.", error);
  } finally {
    client.release();
  }
};

// ==============================================================================
// FUNÇÃO: getMateriaisVendidosParaCalculadora
// Busca a soma das quantidades de materiais de notas com status 'vendida'.
// ==============================================================================
/**
 * Retorna a soma das quantidades de materiais de notas com status 'vendida'.
 * Usado para a calculadora ambiental.
 * @param {object} req - O objeto de requisição do Express.
 * @param {object} res - O objeto de resposta do Express.
 */
const getMateriaisVendidosParaCalculadora = async (req, res) => {
  try {
    const query = `
      SELECT
        inf.material,
        SUM(inf.quantidade) as total_quantidade_vendida
      FROM itens_notas_fiscais inf
      JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
      WHERE nf.status = 'vendida' AND inf.material IS NOT NULL
      GROUP BY inf.material
      ORDER BY inf.material;
    `;
    const { rows } = await pool.query(query);

    // Formata o resultado para garantir que a quantidade seja um número
    const materiaisVendidos = rows.map((row) => ({
      material: row.material,
      total_quantidade_vendida: parseFloat(row.total_quantidade_vendida),
    }));

    console.log(
      "[getMateriaisVendidosParaCalculadora] Dados de materiais vendidos para calculadora:",
      materiaisVendidos
    );
    res.json({ success: true, materiaisVendidos });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Erro interno ao buscar materiais vendidos para a calculadora ambiental.",
      error
    );
  }
};


async function getNotasPorPedidoDeCompra(req, res) {
  const { numero_pedido_compra } = req.query;
  let client; // Declare client aqui para garantir que esteja acessível no finally

  console.log(
    `[Backend] getNotasPorPedidoDeCompra: Buscando notas para o pedido ${numero_pedido_compra}.`
  ); // ADICIONE ESTE LOG

  try {
    client = await pool.connect(); // Obtém uma conexão do pool

    // A query SQL abaixo é a parte mais provável do problema
    const query = `
          SELECT
              nf.id AS nota_fiscal_id,
              nf.numero_nota,
              nf.data_emissao,
              nf.emitente_nome,
              nf.unidade_gestora,
              nf.status,
              inf.id AS item_nota_fiscal_id,
              inf.ncm,
              inf.descricao,
              inf.quantidade,
              inf.unidade,
              inf.material,
              nf.numero_pedido_compra -- Adicione esta coluna para garantir que está buscando o correto
          FROM notas_fiscais nf
          JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
          WHERE nf.numero_pedido_compra = $1
          AND nf.status NOT IN ('vendida', 'cancelada');
      `;

    console.log("[Backend] Executando query:", query, [numero_pedido_compra]); // ADICIONE ESTE LOG

    const result = await client.query(query, [numero_pedido_compra]);

    console.log(
      "[Backend] Query executada com sucesso. Resultados:",
      result.rows.length
    ); // ADICIONE ESTE LOG

    res.json({ success: true, notas: result.rows });
  } catch (error) {
    console.error(
      "[Backend ERROR] Erro em getNotasPorPedidoDeCompra:",
      error.message,
      error.stack
    ); // LOG DE ERRO DETALHADO
    res
      .status(500)
      .json({
        success: false,
        message: "Erro interno do servidor ao buscar notas.",
        error: error.message,
      });
  } finally {
    if (client) {
      client.release(); // Libera a conexão de volta para o pool
    }
  }
}
// ==============================================================================
// FUNÇÃO: atualizarStatusEmLote
// Atualiza o status e/ou unidade gestora de múltiplas notas fiscais em um única transação.
// ==============================================================================
/**
 * Atualiza o status e/ou unidade gestora de múltiplas notas fiscais.
 * @param {object} req - O objeto de requisição do Express.
 * @param {object} res - O objeto de resposta do Express.
 */
const atualizarStatusEmLote = async (req, res) => {
  const { notas, novo_status, nova_unidade_gestora, forcarAlteracao } = req.body;
  
  // Validação básica dos dados recebidos
  if ((!novo_status && !nova_unidade_gestora) || !Array.isArray(notas) || notas.length === 0) {
    return sendErrorResponse(
      res, 
      400, 
      "É necessário informar pelo menos um status ou unidade gestora para atualização e pelo menos uma nota."
    );
  }

  // Lista de status permitidos
  const statusPermitidos = [
    "disponivel",
    "enviada",
    "vendida",
    "reprovada",
    "pendente",
    "ofertada",
  ];

  // Valida o status, se informado
  if (novo_status && !statusPermitidos.includes(novo_status)) {
    return sendErrorResponse(
      res,
      400,
      `Status inválido: '${novo_status}'. Status permitidos: ${statusPermitidos.join(", ")}`
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Array para armazenar os resultados das atualizações
    const resultados = [];
    
    // Itera sobre cada nota para atualização
    for (const notaId of notas) {
      try {
        // Verifica o status atual da nota antes de fazer qualquer alteração
        const statusAtualQuery = `
          SELECT status, numero_nota 
          FROM notas_fiscais 
          WHERE id = $1 
          FOR UPDATE
        `;
        
        const statusResult = await client.query(statusAtualQuery, [notaId]);
        
        if (statusResult.rows.length === 0) {
          resultados.push({
            id: notaId,
            success: false,
            message: "Nota fiscal não encontrada"
          });
          continue;
        }
        
        const statusAtual = statusResult.rows[0].status;
        const numeroNota = statusResult.rows[0].numero_nota;
        
        // Se estiver tentando mudar para 'disponivel' e a nota estiver 'vendida', verifica vínculos
        // Apenas se NÃO estiver forçando a alteração
        if (novo_status === 'disponivel' && statusAtual === 'vendida' && !forcarAlteracao) {
          try {
            const checkVendaQuery = `
              SELECT v.id, v.numero_venda, v.data_venda, v.cliente_final, v.numero_nf_servico
              FROM vendas v
              JOIN itens_notas_fiscais inf ON v.id = inf.venda_id
              WHERE inf.nota_fiscal_id = $1
              LIMIT 1
            `;
            
            const vendaResult = await client.query(checkVendaQuery, [notaId]);
            
            if (vendaResult.rows.length > 0) {
              const venda = vendaResult.rows[0];
              const dataVenda = venda.data_venda ? new Date(venda.data_venda).toLocaleDateString('pt-BR') : 'data não informada';
              const clienteFinal = venda.cliente_final || 'Cliente não informado';
              const nfServico = venda.numero_nf_servico ? `(NF Serviço: ${venda.numero_nf_servico})` : '';
              
              resultados.push({
                id: notaId,
                numero_nota: numeroNota,
                success: false,
                message: [
                  `Não é possível alterar para 'disponivel' a nota ${numeroNota} pois está vinculada a uma venda.`,
                  `Venda #${venda.numero_venda || 'N/A'} de ${dataVenda}`,
                  `Cliente: ${clienteFinal} ${nfServico}`,
                  `Para desfazer esta venda, cancele-a primeiro no módulo de Vendas.`
                ].join(' ')
              });
              
              console.warn(`[atualizarStatusEmLote] Tentativa de alterar nota vendida para disponível:`, {
                notaId,
                numeroNota,
                vendaId: venda.id,
                numeroVenda: venda.numero_venda,
                clienteFinal: venda.cliente_final,
                nfServico: venda.numero_nf_servico
              });
              
              continue;
            }
          } catch (vendaError) {
            console.error(`[atualizarStatusEmLote] Erro ao verificar vínculos de venda para nota ${notaId}:`, vendaError);
            
            // Em caso de erro na verificação, é mais seguro não permitir a alteração
            resultados.push({
              id: notaId,
              numero_nota: numeroNota,
              success: false,
              message: `Não foi possível verificar os vínculos de venda da nota ${numeroNota}. Operação não permitida por segurança.`
            });
            
            continue;
          }
          
          console.log(`[atualizarStatusEmLote] Nota ${numeroNota} (ID: ${notaId}) será alterada de 'vendida' para 'disponivel'`);
        }
        
        // Se estiver forçando a alteração e a nota estiver vendida, desvincular da venda
        if (forcarAlteracao && statusAtual === 'vendida' && novo_status !== 'vendida') {
          console.log(`[atualizarStatusEmLote] FORÇANDO alteração de nota vendida ${numeroNota} (ID: ${notaId}) de 'vendida' para '${novo_status}'`);
          
          try {
            // Desvincular itens da venda
            const itensResult = await client.query(
              'UPDATE itens_notas_fiscais SET venda_id = NULL WHERE nota_fiscal_id = $1',
              [notaId]
            );
            console.log(`[atualizarStatusEmLote] ${itensResult.rowCount} itens desvinculados da venda para nota ${numeroNota}`);
            
            // Limpar número do pedido de compra
            await client.query(
              'UPDATE notas_fiscais SET numero_pedido_compra = NULL WHERE id = $1',
              [notaId]
            );
            console.log(`[atualizarStatusEmLote] Número do pedido de compra limpo para nota ${numeroNota}`);
            
          } catch (desvincularError) {
            console.error(`[atualizarStatusEmLote] Erro ao desvincular venda da nota ${numeroNota}:`, desvincularError);
            // Continua mesmo com erro de desvinculação
          }
        }
        
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        // Monta a query dinamicamente com base nos campos a serem atualizados
        if (novo_status) {
          updates.push(`status = $${paramIndex++}`);
          values.push(novo_status);
        }
        
        if (nova_unidade_gestora) {
          updates.push(`unidade_gestora = $${paramIndex++}`);
          values.push(nova_unidade_gestora);
        }
        
        // Adiciona o ID da nota como último parâmetro
        values.push(notaId);
        
        // Se não houver nada para atualizar, pula para a próxima iteração
        if (updates.length === 0) {
          resultados.push({
            id: notaId,
            numero_nota: numeroNota,
            success: false,
            message: `Nenhuma alteração necessária para a nota ${numeroNota}. Verifique se o novo status ou unidade gestora foi informado.`
          });
          continue;
        }
        
        // Constrói a query dinamicamente
        let query;
        
        // Verificar se a coluna data_atualizacao existe
        const checkColumnQuery = `
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notas_fiscais' 
            AND column_name = 'data_atualizacao'
          ) as coluna_existe;
        `;
        
        const columnExists = await client.query(checkColumnQuery);
        const hasDataAtualizacao = columnExists.rows[0].coluna_existe;
        
        if (hasDataAtualizacao) {
          query = `
            WITH nota_atual AS (
              SELECT id, status as status_atual 
              FROM notas_fiscais 
              WHERE id = $${paramIndex}
              FOR UPDATE
            )
            UPDATE notas_fiscais nf
            SET ${updates.join(', ')}, data_atualizacao = NOW()
            FROM nota_atual
            WHERE nf.id = nota_atual.id
            RETURNING nf.id, nf.numero_nota, nf.status, nf.unidade_gestora, nota_atual.status_atual as status_anterior
          `;
        } else {
          query = `
            WITH nota_atual AS (
              SELECT id, status as status_atual 
              FROM notas_fiscais 
              WHERE id = $${paramIndex}
              FOR UPDATE
            )
            UPDATE notas_fiscais nf
            SET ${updates.join(', ')}
            FROM nota_atual
            WHERE nf.id = nota_atual.id
            RETURNING nf.id, nf.numero_nota, nf.status, nf.unidade_gestora, nota_atual.status_atual as status_anterior
          `;
        }
        
        const result = await client.query(query, values);
        
        if (result.rows.length > 0) {
          const updatedRow = result.rows[0];
          
          // Adiciona um log de auditoria para registrar a mudança de status
          if (novo_status && updatedRow.status_anterior !== novo_status) {
            try {
              const logQuery = `
                INSERT INTO auditoria_notas_fiscais 
                (nota_fiscal_id, campo_alterado, valor_anterior, valor_novo, ip)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
              `;
              
              // Obtém o IP do cliente de forma segura
              const ip = req.headers['x-forwarded-for'] || 
                        req.connection?.remoteAddress || 
                        req.socket?.remoteAddress ||
                        (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
                        '0.0.0.0';
              
              // Remove o prefixo '::ffff:' se presente (comum em IPv4 mapeado para IPv6)
              const cleanIp = typeof ip === 'string' ? ip.replace('::ffff:', '') : '0.0.0.0';
              
              const logResult = await client.query(logQuery, [
                updatedRow.id,
                'status',
                updatedRow.status_anterior,
                updatedRow.status,
                cleanIp
              ]);
              
              console.log(`[Auditoria] Registro de alteração de status para nota ${updatedRow.numero_nota} (ID: ${updatedRow.id}): ${updatedRow.status_anterior} -> ${updatedRow.status}`, {
                registroId: logResult.rows[0]?.id,
                ip: cleanIp,
                forcarAlteracao: forcarAlteracao || false
              });
              
            } catch (logError) {
              console.error(`[atualizarStatusEmLote] Erro ao registrar auditoria para nota ${notaId}:`, logError);
              // Não falha a operação principal por causa do erro de auditoria
              // Mas adiciona um aviso no resultado
              if (!updatedRow.auditWarning) {
                updatedRow.auditWarning = 'Atenção: não foi possível registrar a auditoria desta alteração.';
              }
            }
          }
          
          resultados.push({
            id: notaId,
            success: true,
            status_anterior: updatedRow.status_anterior,
            ...updatedRow,
            forcarAlteracao: forcarAlteracao || false
          });
        } else {
          resultados.push({
            id: notaId,
            numero_nota: numeroNota,
            success: false,
            message: `Não foi possível atualizar a nota ${numeroNota}.`
          });
        }
      } catch (error) {
        console.error(`[atualizarStatusEmLote] Erro ao atualizar nota ${notaId}:`, error);
        resultados.push({
          id: notaId,
          success: false,
          message: error.message
        });
      }
    }
    
    await client.query('COMMIT');
    
    // Conta quantas atualizações foram bem-sucedidas
    const sucessos = resultados.filter(r => r.success).length;
    const falhas = resultados.length - sucessos;
    
    // Log do resultado da operação
    console.log(`[atualizarStatusEmLote] Atualização concluída: ${sucessos} sucesso(s), ${falhas} falha(s)${forcarAlteracao ? ' (FORÇADA)' : ''}`);
    
    res.json({
      success: true,
      message: `Atualização em lote concluída: ${sucessos} nota(s) atualizada(s) com sucesso, ${falhas} falha(s).${forcarAlteracao ? ' (Alteração forçada)' : ''}`,
      total: resultados.length,
      sucessos,
      falhas,
      resultados,
      forcarAlteracao: forcarAlteracao || false
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[atualizarStatusEmLote] Erro na transação:', error);
    sendErrorResponse(res, 500, "Erro ao processar atualização em lote", error);
  } finally {
    client.release();
  }
};

const reprocessarStatusNota = async (req, res) => {
  const { notaId, novoStatus, novaUnidadeGestora, forcarAlteracao } = req.body;

  if (!notaId || !novoStatus) {
    return sendErrorResponse(res, 400, 'ID da nota e novo status são obrigatórios.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obter o status atual e o número do pedido de compra da nota
    const notaResult = await client.query(
      'SELECT status, numero_pedido_compra FROM notas_fiscais WHERE id = $1',
      [notaId]
    );

    if (notaResult.rows.length === 0) {
      throw new Error(`Nota fiscal com ID ${notaId} não encontrada.`);
    }

    const statusAtual = notaResult.rows[0].status;
    const numeroPedidoCompra = notaResult.rows[0].numero_pedido_compra;

    // 2. Validação de transições (apenas se não estiver forçando)
    if (!forcarAlteracao) {
      const transicoesPermitidas = {
        disponivel: ["enviada", "pendente", "ofertada"],
        pendente: ["ofertada", "enviada", "reprovada"],
        ofertada: ["ofertada", "vendida", "reprovada"],
        enviada: ["ofertada", "vendida", "reprovada"],
        vendida: ["disponivel"],
        reprovada: ["disponivel"],
      };

      if (statusAtual && novoStatus && 
          transicoesPermitidas[statusAtual] && 
          !transicoesPermitidas[statusAtual].includes(novoStatus)) {
        throw new Error(`Transição inválida: ${statusAtual} -> ${novoStatus}. Use forcarAlteracao=true para ignorar esta validação.`);
      }
    } else {
      console.log(`[Reprocessar] Modo forçar alteração ativado para nota ID: ${notaId} (${statusAtual} -> ${novoStatus})`);
    }

    // 3. Lógica de reprocessamento se a nota estava 'vendida'
    if (statusAtual === 'vendida' && novoStatus !== 'vendida') {
      console.log(`[Reprocessar] Revertendo venda para a nota ID: ${notaId} (Pedido: ${numeroPedidoCompra})`);

      if (numeroPedidoCompra) {
        // Encontra o ID da venda baseado no número do pedido de compra
        const vendaResult = await client.query(
          'SELECT id FROM vendas WHERE numero_pedido_compra = $1',
          [numeroPedidoCompra]
        );
        
        if (vendaResult.rows.length > 0) {
          const vendaId = vendaResult.rows[0].id;
          
          // Desvincula os itens da venda
          await client.query(
            'UPDATE itens_notas_fiscais SET venda_id = NULL WHERE venda_id = $1',
            [vendaId]
          );
          console.log(`[Reprocessar] Itens desvinculados da venda ID: ${vendaId}`);

          // Deleta o registro da venda
          await client.query('DELETE FROM vendas WHERE id = $1', [vendaId]);
          console.log(`[Reprocessar] Registro de venda ID: ${vendaId} deletado.`);
        }
      }
    }

    // 4. Atualizar o status e/ou unidade gestora da nota fiscal
    let query;
    const params = [];
    if (novaUnidadeGestora) {
        query = 'UPDATE notas_fiscais SET status = $1, unidade_gestora = $2, numero_pedido_compra = CASE WHEN $1 = \'vendida\' THEN numero_pedido_compra ELSE NULL END WHERE id = $3';
        params.push(novoStatus, novaUnidadeGestora, notaId);
    } else {
        query = 'UPDATE notas_fiscais SET status = $1, numero_pedido_compra = CASE WHEN $1 = \'vendida\' THEN numero_pedido_compra ELSE NULL END WHERE id = $2';
        params.push(novoStatus, notaId);
    }
    
    await client.query(query, params);
    console.log(`[Reprocessar] Status da nota ID ${notaId} atualizado para '${novoStatus}'` + (novaUnidadeGestora ? ` e unidade gestora para '${novaUnidadeGestora}'` : '') + (forcarAlteracao ? ' (FORÇADO)' : ''));

    await client.query('COMMIT');
    res.status(200).json({ 
      success: true, 
      message: 'Status da nota reprocessado com sucesso.' + (forcarAlteracao ? ' (Alteração forçada)' : ''),
      forcarAlteracao: forcarAlteracao || false
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[reprocessarStatusNota] Erro detalhado:', error);
    sendErrorResponse(res, 500, 'Erro ao reprocessar o status da nota.', error);
  } finally {
    client.release();
  }
};

// ==============================================================================
// EXPORTAÇÃO DE TODAS AS FUNÇÕES DO CONTROLADOR
// ==============================================================================
module.exports = {
  sendErrorResponse,
  importarXml,
  getStatusCounts,
  getNotasVendidas,
  getMateriaisPorStatus,
  getNotasByCliente,
  getNotasByNumeros,
  updateNotaStatus,
  getAvailableYears,
  getNotasDisponiveisParaVenda,
  registrarVenda,
  getMateriaisVendidosParaCalculadora,
  getNotasPorPedidoDeCompra,
  atualizarStatusEmLote,
  reprocessarStatusNota
};