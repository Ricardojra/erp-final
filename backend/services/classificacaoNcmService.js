const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function getMaterialByNcm(ncm) {
  if (!/^\d{8}$/.test(ncm)) throw new Error("NCM inválido");

  const result = await pool.query(
    "SELECT material FROM classificacao_ncm WHERE ncm = $1",
    [ncm]
  );

  return result.rows.length ? result.rows[0].material : null;
}

module.exports = { getMaterialByNcm };
