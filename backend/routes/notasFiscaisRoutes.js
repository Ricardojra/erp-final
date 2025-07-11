const express = require("express");
const router = express.Router();

// Importa explicitamente todas as funções do controlador de notas fiscais que são usadas nas rotas.
const {
  importarXml,
  getNotasByCliente,
  getNotasByNumeros,
  updateNotaStatus,
  getStatusCounts,
  getNotasVendidas,
  getMateriaisPorStatus,
  getAvailableYears,
  getNotasDisponiveisParaVenda,
  registrarVenda,
  getMateriaisVendidosParaCalculadora,
  getNotasPorPedidoDeCompra,
  atualizarStatusEmLote,
  reprocessarStatusNota,
} = require("../controllers/notasFiscaisController");

// ==============================================================================
// ROTAS DE NOTAS FISCAIS
// ==============================================================================

// Rota para importar XML (POST)
// Rota para importar XML (POST)
router.post("/importar-xml", importarXml);

// Rota para buscar notas fiscais por nome do cliente (GET)
router.get("/cliente/:clienteNome", getNotasByCliente);

// Rota para consultar notas por múltiplos números (GET)
router.get("/consultar", getNotasByNumeros);

// Rota para atualizar o status de uma nota específica por ID (PUT)
router.put("/:id/status", updateNotaStatus);

// Rota para atualizar status e/ou unidade gestora de múltiplas notas em lote
// Esta rota foi substituída pela lógica de reprocessamento individual para garantir a integridade
// router.post("/alterar-status", atualizarStatusEmLote);
router.post('/reprocessar-status', reprocessarStatusNota);

// Rota para atualização em lote com suporte a forçar alteração
router.post('/atualizar-status-lote', atualizarStatusEmLote);

// ==============================================================================
// ROTAS DO DASHBOARD (GET)
// ==============================================================================

// Rota para obter contagens de status
router.get("/status-counts", getStatusCounts);

// Rota para obter notas vendidas
router.get("/vendidas", getNotasVendidas);

// Rota para obter materiais por status
router.get("/materiais-por-status", getMateriaisPorStatus);

// Rota para obter anos disponíveis para filtro de notas
router.get("/years", getAvailableYears);

// Rota para notas disponíveis para venda (geralmente usada para interface de venda)
router.get("/disponiveis-para-venda", getNotasDisponiveisParaVenda);

// Rota para registrar uma venda
router.post("/registrar-venda", registrarVenda);

// Rota para materiais vendidos para calculadora ambiental
router.get(
  "/materiais-vendidos-calculadora",
  getMateriaisVendidosParaCalculadora
);

// Rota para buscar notas fiscais por número de pedido de compra
// CORRIGIDO: Removido o prefixo "/notas-fiscais" e corrigido o typo "pedid" para "pedido".
// A URL final será construída como /api/notas-fiscais + /por-pedido = /api/notas-fiscais/por-pedido
router.get(
  "/por-pedido", // <-- CORRIGIDO AQUI!
  getNotasPorPedidoDeCompra
);

// Rota antiga de atualização em lote - substituída por reprocessar-status
// router.post('/atualizar-status-lote', atualizarStatusEmLote);

module.exports = router;
