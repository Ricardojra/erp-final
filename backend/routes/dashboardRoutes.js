// backend/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// Rota para buscar o resumo de vendas para o dashboard
router.get("/resumo-vendas", dashboardController.getResumoVendas);

module.exports = router;
