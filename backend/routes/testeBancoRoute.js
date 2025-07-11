const express = require('express');
const router = express.Router();
const pool = require('../config/dbConfig');

router.get('/teste-banco', async (req, res) => {
  try {
    // Query que retorna informações do servidor PostgreSQL
    const result = await pool.query(
      `SELECT 
        current_timestamp AS horario_servidor,
        version() AS versao_postgres,
        current_database() AS nome_banco`
    );

    res.json({
      status: 'Conexão bem sucedida!',
      detalhes: result.rows[0]
    });

  } catch (error) {
    console.error('Erro na conexão com o banco:', error);
    res.status(500).json({
      status: 'Erro na conexão',
      detalhes: {
        mensagem: error.message,
        configuracao: pool.options // Mostra configurações sem senha
      }
    });
  }
});

router.get('/info-banco', async (req, res) => {
    try {
      // Query para listar tabelas e contagem de registros
      const tablesQuery = `
        SELECT 
          table_name,
          (xpath('/row/c/text()', 
            query_to_xml(format('SELECT COUNT(*) AS c FROM %I', table_name), false, true, ''))
          )[1]::text::int AS row_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
  
      const result = await pool.query(tablesQuery);
      
      res.json({
        status: 'Sucesso',
        tabelas: result.rows
      });
  
    } catch (error) {
      console.error('Erro ao obter informações do banco:', error);
      res.status(500).json({
        status: 'Erro',
        detalhes: error.message
      });
    }
  });

module.exports = router;