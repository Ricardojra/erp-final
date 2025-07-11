// Script para corrigir a nota fiscal 60572
// Usa configuração direta do banco

const { Pool } = require("pg");

// Configuração direta do banco (ajuste conforme seu ambiente)
const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "sua_senha_aqui", // ⚠️ ALTERE PARA SUA SENHA
  database: "axel_erp", // ⚠️ ALTERE PARA SEU BANCO
});

async function corrigirNota60572() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando status atual da nota 60572...');
    
    // 1. Verificar status atual
    const notaResult = await client.query(
      'SELECT id, numero_nota, status, unidade_gestora, numero_pedido_compra FROM notas_fiscais WHERE numero_nota = $1',
      ['60572']
    );
    
    if (notaResult.rows.length === 0) {
      console.log('❌ Nota fiscal 60572 não encontrada!');
      return;
    }
    
    const nota = notaResult.rows[0];
    console.log('📋 Status atual da nota 60572:', {
      id: nota.id,
      numero_nota: nota.numero_nota,
      status: nota.status,
      unidade_gestora: nota.unidade_gestora,
      numero_pedido_compra: nota.numero_pedido_compra
    });
    
    await client.query('BEGIN');
    
    // 2. Se a nota estiver vendida, desvincular da venda
    if (nota.status === 'vendida' && nota.numero_pedido_compra) {
      console.log('🔄 Desvinculando nota da venda...');
      
      // Desvincular itens da venda
      const itensResult = await client.query(
        'UPDATE itens_notas_fiscais SET venda_id = NULL WHERE nota_fiscal_id = $1',
        [nota.id]
      );
      console.log(`✅ ${itensResult.rowCount} itens desvinculados da venda`);
      
      // Deletar registro de venda
      const vendaResult = await client.query(
        'DELETE FROM vendas WHERE numero_pedido_compra = $1',
        [nota.numero_pedido_compra]
      );
      console.log(`✅ Registro de venda deletado`);
    }
    
    // 3. Alterar status para disponível
    console.log('🔄 Alterando status para disponível...');
    await client.query(
      'UPDATE notas_fiscais SET status = $1, numero_pedido_compra = NULL WHERE id = $2',
      ['disponivel', nota.id]
    );
    
    await client.query('COMMIT');
    console.log('✅ Status da nota 60572 alterado para DISPONÍVEL com sucesso!');
    
    // 4. Verificar resultado final
    const finalResult = await client.query(
      'SELECT id, numero_nota, status, unidade_gestora, numero_pedido_compra FROM notas_fiscais WHERE numero_nota = $1',
      ['60572']
    );
    
    const notaFinal = finalResult.rows[0];
    console.log('📋 Status final da nota 60572:', {
      id: notaFinal.id,
      numero_nota: notaFinal.numero_nota,
      status: notaFinal.status,
      unidade_gestora: notaFinal.unidade_gestora,
      numero_pedido_compra: notaFinal.numero_pedido_compra
    });
    
    console.log('🎉 Agora você pode inserir os dados do pedido de compra na nota 60572!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao corrigir nota:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o script
corrigirNota60572().then(() => {
  console.log('🎉 Script concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 