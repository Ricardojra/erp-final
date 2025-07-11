const express = require('express');
const router = express.Router();
const { consultarNotasDisponiveis, criarLote, clientesPorMaterialEAno } = require('../controllers/lotesController');

// Rota para consultar notas fiscais disponíveis para formar um lote
// Ex: GET /api/lotes/consultar-notas?material=PAPEL
router.get('/consultar-notas', consultarNotasDisponiveis);

// Rota para criar um novo lote com as notas selecionadas
// Ex: POST /api/lotes/criar
router.post('/criar', criarLote);

router.get('/clientes-por-material', clientesPorMaterialEAno);

module.exports = router;
