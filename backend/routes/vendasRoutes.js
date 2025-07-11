// backend/routes/vendasRoutes.js
const express = require("express");
const router = express.Router();
const {
    registrarVenda,
    getHistoricoVendas,
    getRelatorioVendas,
    getMateriaisDisponiveis,
    getRelatorioDetalhado,
    getDetalhesVenda,
    getUnidadesGestoras,
    getMetricasVendas,
    getGraficosVendas
} = require("../controllers/vendasController");

// Rota para registrar uma nova venda
router.post("/registrar", registrarVenda);

// Rota para buscar o histórico de vendas
router.get('/', getHistoricoVendas);

// Rota para o relatório de vendas antigo (resumido)
router.get('/relatorio', getRelatorioVendas);

// Rota para o novo relatório de vendas detalhado por item
router.get('/relatorio-detalhado', getRelatorioDetalhado);

// Rota para buscar a lista de materiais para o filtro do relatório
router.get('/materiais/disponiveis', getMateriaisDisponiveis);

// Rota para buscar unidades gestoras
router.get('/unidades-gestoras', getUnidadesGestoras);

// Rota para buscar métricas de vendas
router.get('/metricas', getMetricasVendas);

// Rota para buscar dados para gráficos
router.get('/graficos', getGraficosVendas);

// Rota para buscar detalhes de uma venda específica (DEVE VIR POR ÚLTIMO)
router.get('/detalhes/:id', getDetalhesVenda);

module.exports = router;
