// Script para testar a conexão com o banco e verificar a nota 60572
const pool = require('./backend/config/dbConfig');

async function testarNota60572() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testando conexão com o banco...');
    
    // Testar conexão
    const testResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Conexão OK:', testResult.rows[0]);
    
    // Verificar se a nota 60572 existe
    console.log('🔍 Verificando nota 60572...');
    const notaResult = await client.query(
      'SELECT id, numero_nota, status, unidade_gestora, numero_pedido_compra FROM notas_fiscais WHERE numero_nota = $1',
      ['60572']
    );
    
    if (notaResult.rows.length === 0) {
      console.log('❌ Nota fiscal 60572 não encontrada!');
      
      // Listar algumas notas para verificar
      const outrasNotas = await client.query(
        'SELECT id, numero_nota, status FROM notas_fiscais LIMIT 5'
      );
      console.log('📋 Algumas notas disponíveis:', outrasNotas.rows);
      
    } else {
      const nota = notaResult.rows[0];
      console.log('✅ Nota 60572 encontrada:', {
        id: nota.id,
        numero_nota: nota.numero_nota,
        status: nota.status,
        unidade_gestora: nota.unidade_gestora,
        numero_pedido_compra: nota.numero_pedido_compra
      });
      
      // Verificar se há vendas associadas
      if (nota.numero_pedido_compra) {
        const vendaResult = await client.query(
          'SELECT id, numero_pedido_compra, cliente_nome FROM vendas WHERE numero_pedido_compra = $1',
          [nota.numero_pedido_compra]
        );
        console.log('📋 Vendas associadas:', vendaResult.rows);
      }
      
      // Verificar itens da nota
      const itensResult = await client.query(
        'SELECT id, material, quantidade, venda_id FROM itens_notas_fiscais WHERE nota_fiscal_id = $1',
        [nota.id]
      );
      console.log('📋 Itens da nota:', itensResult.rows);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o script
testarNota60572().then(() => {
  console.log('🎉 Teste concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 