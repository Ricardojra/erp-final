// Script para reabilitar as validações de status
// ⚠️ ATENÇÃO: Execute este script após corrigir os dados do banco

const pool = require('./backend/config/dbConfig');

async function reabilitarValidacoes() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Reabilitando validações de status...');
    
    // 1. Verificar se existe a tabela de configurações
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'configuracoes_sistema'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Tabela de configurações não encontrada. Execute primeiro o script desabilitar_validacoes_temporario.js');
      return;
    }
    
    // 2. Atualizar configuração para reabilitar validações
    const updateQuery = `
      UPDATE configuracoes_sistema 
      SET valor = 'true', data_atualizacao = NOW()
      WHERE chave = 'validacoes_status_habilitadas'
      RETURNING *;
    `;
    
    const result = await client.query(updateQuery);
    
    if (result.rows.length === 0) {
      console.log('❌ Configuração não encontrada. Execute primeiro o script desabilitar_validacoes_temporario.js');
      return;
    }
    
    console.log('✅ Validações de status reabilitadas');
    console.log('📋 Configuração atualizada:', result.rows[0]);
    
    // 3. Verificar configuração atual
    const checkConfigQuery = `
      SELECT chave, valor, descricao 
      FROM configuracoes_sistema 
      WHERE chave = 'validacoes_status_habilitadas';
    `;
    
    const config = await client.query(checkConfigQuery);
    console.log('🔍 Configuração atual:', config.rows[0]);
    
    console.log('✅ IMPORTANTE:');
    console.log('✅ - As validações de status estão HABILITADAS novamente');
    console.log('✅ - O sistema voltou ao comportamento normal');
    console.log('✅ - As alterações de status agora seguem as regras de validação');
    
  } catch (error) {
    console.error('❌ Erro ao reabilitar validações:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o script
reabilitarValidacoes().then(() => {
  console.log('🎉 Script concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 