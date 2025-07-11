const pool = require('./backend/config/dbConfig');

async function verificarEstrutura() {
  try {
    console.log('Verificando estrutura da tabela itens_notas_fiscais...');
    
    // Verificar se a coluna valor_unitario existe
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'itens_notas_fiscais' 
      AND column_name = 'valor_unitario'
    `);
    
    console.log('Coluna valor_unitario existe:', result.rows.length > 0);
    
    // Listar todas as colunas da tabela
    const todasColunas = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'itens_notas_fiscais' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nColunas da tabela itens_notas_fiscais:');
    todasColunas.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
    // Verificar se há dados na tabela
    const contagem = await pool.query('SELECT COUNT(*) as total FROM itens_notas_fiscais');
    console.log(`\nTotal de registros na tabela: ${contagem.rows[0].total}`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

verificarEstrutura(); 