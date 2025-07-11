const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// Configuração do banco de dados (ajuste com suas credenciais)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Middleware para validar requisições
const validateNcm = (req, res, next) => {
  const { ncm, material } = req.body;
  if (!ncm || !material || ncm.length !== 8 || !/^\d{8}$/.test(ncm)) {
    return res
      .status(400)
      .json({ error: "NCM inválido ou material não fornecido" });
  }
  next();
};

// Listar todos os mapeamentos
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM classificacao_ncm ORDER BY ncm"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar NCMs:", err);
    res.status(500).json({ error: "Erro ao listar NCMs" });
  }
});

// Obter material por NCM (usado na importação)
router.get("/:ncm", async (req, res) => {
  const { ncm } = req.params;
  if (!/^\d{8}$/.test(ncm)) {
    return res.status(400).json({ error: "NCM inválido" });
  }
  try {
    const result = await pool.query(
      "SELECT material FROM classificacao_ncm WHERE ncm = $1",
      [ncm]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "NCM não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao buscar NCM:", err);
    res.status(500).json({ error: "Erro ao buscar NCM" });
  }
});

// Criar novo mapeamento
router.post("/", validateNcm, async (req, res) => {
  const { ncm, material, descricao } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO classificacao_ncm (ncm, material, descricao) VALUES ($1, $2, $3) RETURNING *",
      [ncm, material, descricao || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // Erro de chave única
      res.status(409).json({ error: "NCM já existe" });
    } else {
      console.error("Erro ao criar NCM:", err);
      res.status(500).json({ error: "Erro ao criar NCM" });
    }
  }
});

// Atualizar mapeamento
router.put("/:ncm", validateNcm, async (req, res) => {
  const { ncm } = req.params;
  const { material, descricao } = req.body;
  try {
    const result = await pool.query(
      "UPDATE classificacao_ncm SET material = $1, descricao = $2, data_atualizacao = CURRENT_TIMESTAMP WHERE ncm = $3 RETURNING *",
      [material, descricao || null, ncm]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "NCM não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar NCM:", err);
    res.status(500).json({ error: "Erro ao atualizar NCM" });
  }
});

// Deletar mapeamento
router.delete("/:ncm", async (req, res) => {
  const { ncm } = req.params;
  if (!/^\d{8}$/.test(ncm)) {
    return res.status(400).json({ error: "NCM inválido" });
  }
  try {
    const result = await pool.query(
      "DELETE FROM classificacao_ncm WHERE ncm = $1 RETURNING *",
      [ncm]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "NCM não encontrado" });
    }
    res.json({ message: "NCM deletado com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar NCM:", err);
    res.status(500).json({ error: "Erro ao deletar NCM" });
  }
});

module.exports = router;
