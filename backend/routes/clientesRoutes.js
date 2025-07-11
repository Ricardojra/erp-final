// ./routes/clientesRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/dbConfig"); // Certifique-se de que o caminho para dbConfig está correto

// Função auxiliar para respostas de erro padronizadas
const sendErrorResponse = (res, status, message, error = null) => {
  console.error(
    `[Backend Error] ${message}`,
    error ? { message: error.message, stack: error.stack } : {}
  );
  res.status(status).json({
    success: false,
    message,
    error:
      process.env.NODE_ENV === "development" && error
        ? { message: error.message, stack: error.stack }
        : undefined,
  });
};

// Rota para cadastrar ou atualizar cliente (POST)
router.post("/", async (req, res) => {
  console.log(
    "[Backend] POST /api/clientes - Recebida requisição para salvar cliente."
  );
  const {
    cnpj,
    razao_social,
    nome_fantasia,
    endereco,
    cidade,
    uf,
    cep,
    email_contato,
    telefone_contato,
    whatsapp_numero,
    nome_contato,
  } = req.body;

  let clientDb;

  try {
    if (!cnpj || cnpj.length !== 14 || !razao_social) {
      return sendErrorResponse(
        res,
        400,
        "CNPJ (14 dígitos) e Razão Social são obrigatórios."
      );
    }

    clientDb = await pool.connect();
    await clientDb.query("BEGIN");

    const existingClient = await clientDb.query(
      "SELECT id, razao_social FROM clientes WHERE cnpj = $1",
      [cnpj]
    );

    if (existingClient.rows.length > 0) {
      const clientId = existingClient.rows[0].id;
      console.log(
        `[Backend] Cliente com CNPJ ${cnpj} já existe (ID: ${clientId}). Tentando atualizar.`
      );

      const updateQuery = `
                UPDATE clientes
                SET
                    razao_social = COALESCE($1, razao_social),
                    nome_fantasia = COALESCE($2, nome_fantasia),
                    endereco = COALESCE($3, endereco),
                    cidade = COALESCE($4, cidade),
                    uf = COALESCE($5, uf),
                    cep = COALESCE($6, cep),
                    email_contato = COALESCE($7, email_contato),
                    telefone_contato = COALESCE($8, telefone_contato),
                    whatsapp_numero = COALESCE($9, whatsapp_numero),
                    nome_contato = COALESCE($10, nome_contato)
                WHERE id = $11
                RETURNING id;
            `;
      const updateParams = [
        razao_social,
        nome_fantasia,
        endereco,
        cidade,
        uf,
        cep,
        email_contato,
        telefone_contato,
        whatsapp_numero,
        nome_contato,
        clientId,
      ];
      await clientDb.query(updateQuery, updateParams);

      await clientDb.query("COMMIT");
      console.log(
        `[Backend] Cliente com CNPJ ${cnpj} (ID: ${clientId}) atualizado com sucesso.`
      );
      return res.status(200).json({
        success: true,
        message: `Cliente com CNPJ ${cnpj} atualizado com sucesso (ID: ${clientId}).`,
      });
    } else {
      console.log(
        `[Backend] Cliente com CNPJ ${cnpj} não encontrado. Cadastrando novo cliente.`
      );
      const insertQuery = `
                INSERT INTO clientes (cnpj, razao_social, nome_fantasia, endereco, cidade, uf, cep, email_contato, telefone_contato, whatsapp_numero, nome_contato)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id;
            `;
      const insertParams = [
        cnpj,
        razao_social,
        nome_fantasia,
        endereco,
        cidade,
        uf,
        cep,
        email_contato,
        telefone_contato,
        whatsapp_numero,
        nome_contato,
      ];
      const result = await clientDb.query(insertQuery, insertParams);
      const newClientId = result.rows[0].id;

      await clientDb.query("COMMIT");
      console.log(
        `[Backend] Novo cliente cadastrado com sucesso (ID: ${newClientId}).`
      );
      return res.status(201).json({
        success: true,
        message: `Cliente cadastrado com sucesso (ID: ${newClientId}).`,
        clientId: newClientId,
      });
    }
  } catch (error) {
    if (clientDb) {
      await clientDb
        .query("ROLLBACK")
        .catch((rollbackErr) =>
          console.error("[Backend] Erro no rollback:", rollbackErr)
        );
    }
    sendErrorResponse(
      res,
      500,
      "Erro ao salvar cliente no banco de dados.",
      error
    );
  } finally {
    if (clientDb) {
      clientDb.release();
    }
  }
});

// ***** ROTA ATUALIZADA: Listar todos os clientes com tipos de materiais (GET /) *****
router.get("/", async (req, res) => {
  console.log(
    "[Backend] GET /api/clientes - Recebida requisição para listar todos os clientes."
  );
  try {
    const query = `
            SELECT
                c.id,
                c.cnpj,
                c.razao_social,
                c.nome_fantasia,
                c.nome_contato,
                c.endereco,
                c.cidade,
                c.uf,
                c.cep,
                c.email_contato,
                c.telefone_contato,
                c.whatsapp_numero,
                c.ativo,
                c.data_cadastro,
                -- Agrega os tipos de materiais únicos em uma string separada por vírgulas
                COALESCE(
                    CASE 
                        WHEN COUNT(it.material) > 0 THEN STRING_AGG(DISTINCT it.material, ', ')
                        ELSE 'Nenhum'
                    END, 
                    'Nenhum'
                ) AS materiais_vendidos
            FROM
                clientes c
            LEFT JOIN
                notas_fiscais nf ON c.cnpj = nf.emitente_cnpj
            LEFT JOIN
                itens_notas_fiscais it ON nf.id = it.nota_fiscal_id
            GROUP BY
                c.id, c.cnpj, c.razao_social, c.nome_fantasia, c.nome_contato, c.endereco, c.cidade, c.uf, c.cep, c.email_contato, c.telefone_contato, c.whatsapp_numero, c.ativo, c.data_cadastro
            ORDER BY
                c.razao_social ASC;
        `;
    const { rows } = await pool.query(query);
    console.log(`[Backend] Clientes encontrados: ${rows.length}`);
    res.status(200).json({ success: true, clients: rows });
  } catch (error) {
    console.error("[Backend Error] Erro ao buscar a lista de clientes:", error);
    sendErrorResponse(res, 500, "Erro ao buscar a lista de clientes.", error);
  }
});

// Rota para buscar cliente por CNPJ (GET /cnpj/:cnpj)
router.get("/cnpj/:cnpj", async (req, res) => {
  console.log(
    `[Backend] GET /api/clientes/cnpj/${req.params.cnpj} - Recebida requisição para buscar cliente por CNPJ.`
  );
  const { cnpj } = req.params;
  if (!cnpj || cnpj.length !== 14) {
    return sendErrorResponse(res, 400, "CNPJ inválido. Deve ter 14 dígitos.");
  }
  try {
    const query = `SELECT * FROM clientes WHERE cnpj = $1;`;
    const { rows } = await pool.query(query, [cnpj]);
    console.log(
      `[Backend] Busca por CNPJ ${cnpj}: ${rows.length} cliente(s) encontrado(s).`
    );
    if (rows.length > 0) {
      res.json(rows);
    } else {
      res.status(404).json({ message: "Cliente não encontrado." });
    }
  } catch (error) {
    sendErrorResponse(res, 500, "Erro ao buscar cliente por CNPJ.", error);
  }
});

// ***** ROTA ATUALIZADA: Buscar cliente por ID (GET /:id) - Com Tipos de Materiais *****
router.get("/:id", async (req, res) => {
  console.log(
    `[Backend] GET /api/clientes/${req.params.id} - Recebida requisição para buscar cliente por ID.`
  );
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return sendErrorResponse(res, 400, "ID do cliente inválido.");
  }
  try {
    const query = `
            SELECT
                c.id,
                c.cnpj,
                c.razao_social,
                c.nome_fantasia,
                c.nome_contato,
                c.endereco,
                c.cidade,
                c.uf,
                c.cep,
                c.email_contato,
                c.telefone_contato,
                c.whatsapp_numero,
                c.ativo,
                c.data_cadastro,
                -- Agrega os tipos de materiais únicos em uma string separada por vírgulas
                COALESCE(
                    CASE 
                        WHEN COUNT(it.material) > 0 THEN STRING_AGG(DISTINCT it.material, ', ')
                        ELSE 'Nenhum'
                    END, 
                    'Nenhum'
                ) AS materiais_vendidos
            FROM
                clientes c
            LEFT JOIN
                notas_fiscais nf ON c.cnpj = nf.emitente_cnpj
            LEFT JOIN
                itens_notas_fiscais it ON nf.id = it.nota_fiscal_id
            WHERE
                c.id = $1
            GROUP BY
                c.id, c.cnpj, c.razao_social, c.nome_fantasia, c.nome_contato, c.endereco, c.cidade, c.uf, c.cep, c.email_contato, c.telefone_contato, c.whatsapp_numero, c.ativo, c.data_cadastro;
        `;
    const { rows } = await pool.query(query, [id]);
    console.log(
      `[Backend] Busca por ID ${id}: ${rows.length} cliente(s) encontrado(s).`
    );
    if (rows.length > 0) {
      res.json(rows);
    } else {
      res.status(404).json({ message: "Cliente não encontrado." });
    }
  } catch (error) {
    sendErrorResponse(res, 500, "Erro ao buscar cliente por ID.", error);
  }
});

// Rota para atualizar cliente por ID (PUT /:id)
router.put("/:id", async (req, res) => {
  console.log(
    `[Backend] PUT /api/clientes/${req.params.id} - Recebida requisição para atualizar cliente.`
  );
  const { id } = req.params;
  const {
    cnpj,
    razao_social,
    nome_fantasia,
    endereco,
    cidade,
    uf,
    cep,
    email_contato,
    telefone_contato,
    whatsapp_numero,
    nome_contato,
    ativo,
  } = req.body;

  if (!id || isNaN(parseInt(id))) {
    return sendErrorResponse(res, 400, "ID do cliente inválido.");
  }
  if (!cnpj || cnpj.length !== 14 || !razao_social) {
    return sendErrorResponse(
      res,
      400,
      "CNPJ (14 dígitos) e Razão Social são obrigatórios."
    );
  }

  try {
    const updateQuery = `
            UPDATE clientes
            SET
                cnpj = $1,
                razao_social = $2,
                nome_fantasia = $3,
                endereco = $4,
                cidade = $5,
                uf = $6,
                cep = $7,
                email_contato = $8,
                telefone_contato = $9,
                whatsapp_numero = $10,
                nome_contato = $11,
                ativo = $12
            WHERE id = $13
            RETURNING id, cnpj, razao_social;
        `;
    const updateParams = [
      cnpj,
      razao_social,
      nome_fantasia,
      endereco,
      cidade,
      uf,
      cep,
      email_contato,
      telefone_contato,
      whatsapp_numero,
      nome_contato,
      ativo,
      id,
    ];

    const { rows } = await pool.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return sendErrorResponse(
        res,
        404,
        `Cliente com ID ${id} não encontrado.`
      );
    }

    console.log(`[Backend] Cliente ID ${id} atualizado com sucesso.`);
    res
      .status(200)
      .json({
        success: true,
        message: `Cliente ${rows[0].razao_social} atualizado com sucesso!`,
        updatedClient: rows[0],
      });
  } catch (error) {
    sendErrorResponse(
      res,
      500,
      "Erro ao atualizar cliente no banco de dados.",
      error
    );
  }
});

module.exports = router;
