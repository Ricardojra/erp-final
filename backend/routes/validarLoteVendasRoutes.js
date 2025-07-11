const express = require('express');
const router = express.Router();
const { 
  validarLoteVendas, 
  validarItemVenda, 
  getEstatisticasValidacao 
} = require('../controllers/validarLoteVendasController');

// Rota para validar um lote completo de vendas
// POST /api/validar-lote-vendas/validar
router.post('/validar', validarLoteVendas);

// Rota para validar um item específico de venda
// GET /api/validar-lote-vendas/item/:item_id
router.get('/item/:item_id', validarItemVenda);

// Rota para obter estatísticas de validação
// GET /api/validar-lote-vendas/estatisticas
router.get('/estatisticas', getEstatisticasValidacao);

module.exports = router; 