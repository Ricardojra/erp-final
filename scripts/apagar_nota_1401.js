const { Pool } = require('pg');

// Configuração do banco de dados (usar as mesmas configurações do projeto)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gestao_estoque',
  password: 'sua_senha_aqui', // Substitua pela senha real
  port: 5432,
});

async function apagarNotaFiscal1401() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando se a nota fiscal 1401 existe...');
    
    // Verificar se a nota existe
    const checkQuery = `
      SELECT 
        nf.id,
        nf.numero_nota,
        nf.emitente_nome,
        nf.data_emissao,
        COUNT(inf.id) as total_itens
      FROM notas_fiscais nf
      LEFT JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
      WHERE nf.numero_nota = '1401'
      GROUP BY nf.id, nf.numero_nota, nf.emitente_nome, nf.data_emissao
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ Nota fiscal 1401 não encontrada no banco de dados.');
      return;
    }
    
    const nota = checkResult.rows[0];
    console.log(`✅ Nota fiscal 1401 encontrada:`);
    console.log(`   - ID: ${nota.id}`);
    console.log(`   - Emitente: ${nota.emitente_nome}`);
    console.log(`   - Data de Emissão: ${nota.data_emissao}`);
    console.log(`   - Total de itens: ${nota.total_itens}`);
    
    // Iniciar transação
    await client.query('BEGIN');
    
    console.log('🗑️  Removendo itens da nota fiscal...');
    
    // Apagar os itens da nota fiscal
    const deleteItemsQuery = `
      DELETE FROM itens_notas_fiscais 
      WHERE nota_fiscal_id = $1
    `;
    
    const deleteItemsResult = await client.query(deleteItemsQuery, [nota.id]);
    console.log(`✅ ${deleteItemsResult.rowCount} itens removidos.`);
    
    console.log('🗑️  Removendo nota fiscal...');
    
    // Apagar a nota fiscal
    const deleteNotaQuery = `
      DELETE FROM notas_fiscais 
      WHERE id = $1
    `;
    
    const deleteNotaResult = await client.query(deleteNotaQuery, [nota.id]);
    console.log(`✅ Nota fiscal removida.`);
    
    // Confirmar transação
    await client.query('COMMIT');
    
    console.log('✅ Operação concluída com sucesso!');
    console.log('📋 Resumo:');
    console.log(`   - Nota fiscal 1401 removida`);
    console.log(`   - ${deleteItemsResult.rowCount} itens removidos`);
    
  } catch (error) {
    // Reverter transação em caso de erro
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a operação:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o script
apagarNotaFiscal1401()
  .then(() => {
    console.log('🏁 Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  }); 