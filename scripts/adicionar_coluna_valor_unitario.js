const pool = require('../backend/config/dbConfig');

async function adicionarColunaValorUnitario() {
  try {
    console.log('Verificando se a coluna valor_unitario existe...');
    
    // Verificar se a coluna já existe
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'itens_notas_fiscais' 
      AND column_name = 'valor_unitario'
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('Coluna valor_unitario não existe. Adicionando...');
      
      // Adicionar a coluna
      const alterQuery = `
        ALTER TABLE itens_notas_fiscais 
        ADD COLUMN valor_unitario NUMERIC(10,2) DEFAULT 0.00
      `;
      
      await pool.query(alterQuery);
      console.log('✅ Coluna valor_unitario adicionada com sucesso!');
      
      // Adicionar comentário
      const commentQuery = `
        COMMENT ON COLUMN itens_notas_fiscais.valor_unitario IS 'Valor unitário por tonelada do item da nota fiscal'
      `;
      
      await pool.query(commentQuery);
      console.log('✅ Comentário adicionado à coluna valor_unitario');
      
    } else {
      console.log('✅ Coluna valor_unitario já existe na tabela itens_notas_fiscais');
    }
    
    // Mostrar estrutura atual da tabela
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'itens_notas_fiscais'
      ORDER BY ordinal_position
    `;
    
    const structureResult = await pool.query(structureQuery);
    console.log('\n📋 Estrutura atual da tabela itens_notas_fiscais:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna valor_unitario:', error);
  } finally {
    await pool.end();
  }
}

adicionarColunaValorUnitario(); 