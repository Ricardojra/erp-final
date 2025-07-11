// Script para corrigir status das notas vendidas
// Corrige diretamente no banco de dados sem usar as validações do sistema

// Carregar variáveis de ambiente
require('dotenv').config();

const pool = require('./backend/config/dbConfig');

async function corrigirNotasVendidas() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando notas vendidas que precisam ser corrigidas...');
    
    // 1. Listar todas as notas vendidas
    const notasVendidas = await client.query(`
      SELECT id, numero_nota, status, unidade_gestora, numero_pedido_compra 
      FROM notas_fiscais 
      WHERE status = 'vendida'
      ORDER BY numero_nota
    `);
    
    console.log(`📋 Encontradas ${notasVendidas.rows.length} notas vendidas`);
    
    if (notasVendidas.rows.length === 0) {
      console.log('✅ Nenhuma nota vendida encontrada para corrigir');
      return;
    }
    
    // 2. Mostrar as primeiras 10 notas para verificação
    console.log('📋 Primeiras 10 notas vendidas:');
    notasVendidas.rows.slice(0, 10).forEach((nota, index) => {
      console.log(`${index + 1}. Nota ${nota.numero_nota} (ID: ${nota.id}) - Status: ${nota.status}`);
    });
    
    await client.query('BEGIN');
    
    let sucessos = 0;
    let falhas = 0;
    
    // 3. Processar cada nota vendida
    for (const nota of notasVendidas.rows) {
      try {
        console.log(`🔄 Processando nota ${nota.numero_nota} (ID: ${nota.id})...`);
        
        // Desvincular itens da venda se houver
        if (nota.numero_pedido_compra) {
          const itensResult = await client.query(
            'UPDATE itens_notas_fiscais SET venda_id = NULL WHERE nota_fiscal_id = $1',
            [nota.id]
          );
          console.log(`  ✅ ${itensResult.rowCount} itens desvinculados`);
          
          // Deletar registro de venda
          const vendaResult = await client.query(
            'DELETE FROM vendas WHERE numero_pedido_compra = $1',
            [nota.numero_pedido_compra]
          );
          console.log(`  ✅ Registro de venda deletado`);
        }
        
        // Alterar status para disponível
        await client.query(
          'UPDATE notas_fiscais SET status = $1, numero_pedido_compra = NULL WHERE id = $2',
          ['disponivel', nota.id]
        );
        
        console.log(`  ✅ Status alterado para 'disponivel'`);
        sucessos++;
        
      } catch (error) {
        console.error(`  ❌ Erro ao processar nota ${nota.numero_nota}:`, error.message);
        falhas++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n📊 RESUMO DA OPERAÇÃO:');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Falhas: ${falhas}`);
    console.log(`📋 Total processado: ${notasVendidas.rows.length}`);
    
    // 4. Verificar resultado final
    const resultadoFinal = await client.query(`
      SELECT 
        status,
        COUNT(*) as total
      FROM notas_fiscais 
      GROUP BY status 
      ORDER BY total DESC
    `);
    
    console.log('\n📋 DISTRIBUIÇÃO ATUAL DE STATUS:');
    resultadoFinal.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.total} notas`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro geral:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o script
corrigirNotasVendidas().then(() => {
  console.log('🎉 Script concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 