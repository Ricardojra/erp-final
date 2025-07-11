// backend/routes/documentosRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/dbConfig"); // Conexão com o banco de dados
const multer = require("multer"); // Para lidar com upload de arquivos
const path = require("path"); // Para lidar com caminhos de arquivos
const fs = require("fs"); // Para lidar com o sistema de arquivos
// const notasFiscaisController = require("../controllers/notasFiscaisController"); // Não é usado diretamente aqui, pode ser removido se não houver outra dependência

// Configuração do Multer para armazenamento de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define o diretório de upload: backend/uploads/documentos
    const uploadPath = path.join(__dirname, "../uploads/documentos");
    // Garante que o diretório de upload existe de forma recursiva
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath); // 'null' para erro, 'uploadPath' para o destino
  },
  filename: (req, file, cb) => {
    // Gera um nome de arquivo único para evitar colisões (timestamp + random)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Usa o nome original do arquivo com um sufixo único e sua extensão original
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Filtro de arquivos para aceitar apenas PDFs e imagens
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Aceita o arquivo
  } else {
    // Rejeita o arquivo com uma mensagem de erro
    cb(
      new Error("Apenas arquivos PDF, JPEG, PNG e GIF são permitidos!"),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB por arquivo (10MB * 1024KB/MB * 1024B/KB)
});

// Função auxiliar para respostas de erro padronizadas
const sendErrorResponse = (res, status, message, error = null) => {
  console.error(
    `[Backend Error] ${message}`,
    error ? { message: error.message, stack: error.stack } : {}
  );
  res.status(status).json({
    success: false,
    message,
    // Em ambiente de desenvolvimento, inclui detalhes do erro no JSON da resposta
    error:
      process.env.NODE_ENV === "development" && error
        ? { message: error.message, stack: error.stack }
        : undefined,
  });
};

// --- ROTAS DO MÓDULO DE DOCUMENTOS ---

// Rota para upload de um novo documento
// Usa o middleware 'upload.single("documento")' para processar o arquivo.
// 'documento' deve corresponder ao nome do campo 'name' do input type="file" no frontend (formData.append('documento', ...)).
router.post("/upload", upload.single("documento"), async (req, res) => {
  console.log(
    "[Backend] POST /api/documentos/upload - Recebida requisição de upload."
  );
  if (!req.file) {
    // Se Multer não processou um arquivo
    return sendErrorResponse(res, 400, "Nenhum arquivo foi enviado.");
  }

  // Desestruturação dos dados do corpo da requisição (metadados do documento)
  const { cliente_id, tipo_documento_id, data_validade, usuario_upload } =
    req.body;
  const caminho_arquivo = req.file.path; // Caminho completo onde o arquivo foi salvo pelo Multer
  const tipo_mime = req.file.mimetype; // Tipo MIME do arquivo

  let clientDb; // Variável para a conexão com o banco de dados

  try {
    clientDb = await pool.connect(); // Obtém uma conexão do pool
    await clientDb.query("BEGIN"); // Inicia uma transação de banco de dados para garantir atomicidade

    // 1. Validar cliente_id e tipo_documento_id
    if (!cliente_id || isNaN(parseInt(cliente_id))) {
      // Se inválido, remove o arquivo salvo pelo Multer e retorna erro
      fs.unlinkSync(caminho_arquivo);
      return sendErrorResponse(res, 400, "ID do cliente inválido.");
    }
    if (!tipo_documento_id || isNaN(parseInt(tipo_documento_id))) {
      // Se inválido, remove o arquivo salvo pelo Multer e retorna erro
      fs.unlinkSync(caminho_arquivo);
      return sendErrorResponse(res, 400, "ID do tipo de documento inválido.");
    }

    // 2. Verificar se o tipo de documento requer validade (consulta ao DB)
    const tipoDocQuery = await clientDb.query(
      "SELECT requer_validade FROM tipos_documento WHERE id = $1",
      [tipo_documento_id]
    );

    if (tipoDocQuery.rows.length === 0) {
      // Tipo de documento não encontrado no DB, remove o arquivo
      fs.unlinkSync(caminho_arquivo);
      return sendErrorResponse(res, 404, "Tipo de documento não encontrado.");
    }

    const requerValidade = tipoDocQuery.rows[0].requer_validade;

    if (requerValidade && !data_validade) {
      // Se o tipo requer validade mas nenhuma data foi fornecida, remove o arquivo
      fs.unlinkSync(caminho_arquivo);
      return sendErrorResponse(
        res,
        400,
        "Este tipo de documento requer uma data de validade."
      );
    }

    // 3. Inserir o documento no banco de dados
    const insertQuery = `
            INSERT INTO documentos (cliente_id, tipo_documento_id, caminho_arquivo, data_validade, usuario_upload, tipo_mime, nome_arquivo)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, cliente_id, tipo_documento_id, data_validade, data_upload, nome_arquivo;
        `;
    const insertValues = [
      cliente_id,
      tipo_documento_id,
      caminho_arquivo,
      data_validade || null, // data_validade pode ser nula
      usuario_upload || "Sistema", // Valor padrão se não for fornecido
      tipo_mime,
      req.file.filename, // Adiciona o nome único do arquivo gerado pelo Multer
    ];

    const result = await clientDb.query(insertQuery, insertValues);

    await clientDb.query("COMMIT"); // Confirma a transação
    console.log(
      `[Backend] Documento (ID: ${result.rows[0].id}, Nome: ${req.file.filename}) salvo no banco de dados para cliente ${cliente_id}.`
    );
    res.status(201).json({
      success: true,
      message: "Documento enviado e registrado com sucesso!",
      documento: result.rows[0],
    });
  } catch (error) {
    if (clientDb) {
      await clientDb
        .query("ROLLBACK") // Em caso de erro, desfaz a transação
        .catch((rollbackErr) =>
          console.error("[Backend] Erro no rollback:", rollbackErr)
        );
    }
    // Se houver um erro no DB ou validação, remova o arquivo que foi salvo fisicamente
    if (req.file && fs.existsSync(caminho_arquivo)) {
      fs.unlinkSync(caminho_arquivo);
    }
    sendErrorResponse(
      res,
      500,
      "Erro ao registrar documento no banco de dados.",
      error
    );
  } finally {
    if (clientDb) {
      clientDb.release(); // Libera a conexão com o banco de dados de volta para o pool
    }
  }
});

// Rota para listar todos os tipos de documento
// Usada pelo frontend para popular o select de "Tipo de Documento" no modal de upload.
router.get("/tipos-documento", async (req, res) => {
  console.log(
    "[Backend] GET /api/documentos/tipos-documento - Recebida requisição para listar tipos de documento."
  );
  try {
    const query = `SELECT id, nome, requer_validade FROM tipos_documento ORDER BY nome ASC;`;
    const { rows } = await pool.query(query);
    console.log(`[Backend] ${rows.length} tipos de documento encontrados.`);
    res.status(200).json({ success: true, tipos_documento: rows });
  } catch (error) {
    // Removido o 'error' aqui para pegar o erro no 'sendErrorResponse'
    sendErrorResponse(
      res,
      500,
      "Erro ao buscar a lista de tipos de documento.",
      error
    );
  }
});

// Rota para listar todos os documentos (com filtro opcional por cliente_id)
// Usada pelo frontend para popular a tabela principal de documentos.
router.get("/", async (req, res) => {
  const { cliente_id } = req.query; // Pega o cliente_id da query string (ex: /api/documentos?cliente_id=1)
  console.log(
    `[Backend] GET /api/documentos - Recebida requisição para listar documentos. Cliente ID: ${
      cliente_id || "Todos"
    }`
  );

  let query = `
        SELECT
            d.id,
            d.cliente_id,
            c.razao_social AS cliente_razao_social, -- Adiciona Razão Social do cliente
            d.tipo_documento_id,
            td.nome AS nome_documento_tipo, -- Nome do tipo de documento
            td.requer_validade, -- Se o tipo de documento requer validade
            d.caminho_arquivo, -- Caminho absoluto no servidor
            d.nome_arquivo,    -- Nome do arquivo gerado pelo Multer (ex: documento-12345.pdf)
            d.data_validade,
            d.data_upload,
            d.usuario_upload,
            d.tipo_mime,
            d.ativo,
            CASE -- Lógica para determinar o status de validade
                WHEN d.data_validade IS NULL THEN 'Não aplicável'
                WHEN d.data_validade >= CURRENT_DATE THEN 'Válido'
                ELSE 'Expirado'
            END AS status_validade
        FROM
            documentos d
        JOIN
            tipos_documento td ON d.tipo_documento_id = td.id
        JOIN
            clientes c ON d.cliente_id = c.id
        WHERE
            d.ativo = TRUE -- Filtra apenas documentos ativos
    `;
  const values = []; // Array para os valores dos parâmetros da query

  if (cliente_id) {
    query += ` AND d.cliente_id = $1`; // Adiciona filtro por cliente_id se presente
    values.push(cliente_id);
  }

  query += ` ORDER BY c.razao_social ASC, td.nome ASC;`; // Ordena os resultados

  try {
    const { rows } = await pool.query(query, values);
    console.log(`[Backend] ${rows.length} documentos encontrados.`);
    res.status(200).json({ success: true, documentos: rows });
  } catch (error) {
    // Este é o catch que pegou o erro 'coluna d.nome_arquivo não existe'
    sendErrorResponse(res, 500, "Erro ao buscar a lista de documentos.", error);
  }
});

// Rota para visualizar um documento (servir o arquivo)
// Esta rota é a provável origem do erro "Arquivo do documento não encontrado no servidor."
router.get("/view/:id", async (req, res) => {
  const { id } = req.params; // Pega o ID do documento da URL
  console.log(
    `[Backend] GET /api/documentos/view/${id} - Recebida requisição para visualizar documento.`
  );
  try {
    // 1. Busca o caminho do arquivo e o tipo MIME no banco de dados usando o ID do documento.
    const query = `SELECT caminho_arquivo, tipo_mime FROM documentos WHERE id = $1 AND ativo = TRUE;`;
    // --- LOG DE DEPURACAO: Mostra a query sendo executada ---
    console.log(`[Backend][VIEW] Executando query para ID ${id}: ${query}`);
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      // Se nenhum documento for encontrado com o ID ou estiver inativo.
      // --- LOG DE DEPURACAO: Indica que o documento não foi encontrado no DB ---
      console.log(
        `[Backend][VIEW] Documento com ID ${id} não encontrado ou inativo no DB.`
      );
      return sendErrorResponse(
        res,
        404,
        "Documento não encontrado ou inativo."
      );
    }

    const { caminho_arquivo, tipo_mime } = rows[0]; // Extrai o caminho e o tipo MIME do resultado da consulta
    // --- LOG DE DEPURACAO: Mostra o caminho do arquivo e tipo MIME encontrados no DB ---
    console.log(
      `[Backend][VIEW] Documento encontrado no DB. Caminho: ${caminho_arquivo}, Tipo MIME: ${tipo_mime}`
    );

    // 2. Verifica se o arquivo existe fisicamente no sistema de arquivos.
    // O Multer salva o caminho_arquivo como um caminho absoluto (ex: C:\app_axel\...\backend\uploads\documentos\file-123.pdf)
    if (fs.existsSync(caminho_arquivo)) {
      res.setHeader("Content-Type", tipo_mime); // Define o Content-Type para que o navegador saiba como interpretar o arquivo
      // res.setHeader('Content-Disposition', `inline; filename="${path.basename(caminho_arquivo)}"`); // Para exibir no navegador (inline)
      // res.setHeader('Content-Disposition', `attachment; filename="${path.basename(caminho_arquivo)}"`); // Para forçar download (attachment)
      res.sendFile(caminho_arquivo); // Envia o arquivo ao cliente
      console.log(`[Backend][VIEW] Documento ${id} enviado para visualização.`);
    } else {
      // Se o arquivo NÃO for encontrado no caminho especificado pelo banco de dados.
      console.error(
        `[Backend][VIEW] Arquivo não encontrado no caminho: ${caminho_arquivo}`
      );
      sendErrorResponse(
        // Esta é a mensagem de erro que você está recebendo
        res,
        404, // Retorna 404 porque o arquivo não foi encontrado onde deveria
        "Arquivo do documento não encontrado no servidor."
      );
    }
  } catch (error) {
    sendErrorResponse(res, 500, "Erro ao visualizar documento.", error);
  }
});

// Rota para "excluir" (inativar) um documento
// Esta rota realiza uma exclusão lógica, marcando o documento como inativo (ativo = FALSE).
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(
    `[Backend] DELETE /api/documentos/${id} - Recebida requisição para inativar documento.`
  );
  try {
    const query = `UPDATE documentos SET ativo = FALSE WHERE id = $1 RETURNING id;`;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return sendErrorResponse(res, 404, "Documento não encontrado.");
    }
    console.log(
      `[Backend] Documento (ID: ${rows[0].id}) inativado com sucesso.`
    );
    res.status(200).json({
      success: true,
      message: "Documento inativado com sucesso.",
      documento: rows[0],
    });
  } catch (error) {
    sendErrorResponse(res, 500, "Erro ao inativar documento.", error);
  }
});

module.exports = router;
