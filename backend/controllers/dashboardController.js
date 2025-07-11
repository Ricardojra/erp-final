// backend/controllers/dashboardController.js
const pool = require("../config/dbConfig"); // Verifique o caminho do seu pool de conexão

async function getResumoVendas(req, res) {
  let client;
  try {
    client = await pool.connect();

    // Query 1: Total de Notas Vendidas e Valor Total das Notas Vendidas
    const vendasResult = await client.query(
      `SELECT
         COUNT(*) AS total_notas_vendidas,
         COALESCE(SUM(valor_total), 0) AS valor_total_vendido -- Assumindo que 'valor_total' está na tabela notas_fiscais
       FROM
         notas_fiscais
       WHERE
         status = 'vendida';`
    );

    // Query 2: Total de Notas em Status 'Ofertada'
    const ofertadasResult = await client.query(
      `SELECT
         COUNT(*) AS total_notas_ofertadas
       FROM
         notas_fiscais
       WHERE
         status = 'ofertada';`
    );

    const resumo = {
      totalNotasVendidas: parseInt(vendasResult.rows[0].total_notas_vendidas),
      valorTotalVendidas: parseFloat(vendasResult.rows[0].valor_total_vendido),
      totalNotasOfertadas: parseInt(
        ofertadasResult.rows[0].total_notas_ofertadas
      ),
    };

    console.log("[Backend] Dados do resumo de vendas enviados:", resumo);
    res.status(200).json({ success: true, data: resumo });
  } catch (error) {
    console.error("[Backend ERROR] Erro ao buscar resumo de vendas:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Erro ao buscar resumo de vendas.",
        error: error.message,
      });
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  getResumoVendas,
};
