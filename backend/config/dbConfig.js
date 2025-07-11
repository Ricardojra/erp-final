const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, ".env") }); // Garante que .env seja carregado

// Configuração do Pool de Conexões PostgreSQL (VERSÃO FINAL)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
  console.log("✅ Conectado ao banco de dados PostgreSQL!");
});

pool.on("error", (err) => {
  console.error("❌ Erro inesperado no cliente PostgreSQL", err);
});

module.exports = pool;

