// Script para desabilitar temporariamente as validações de status
// ⚠️ ATENÇÃO: Este script deve ser usado apenas para correção de dados
// ⚠️ LEMBRE-SE: Reabilitar as validações após a correção dos dados

const pool = require('./backend/config/dbConfig');

async function desabilitarValidacoes() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Desabilitando validações de status temporariamente...');
    
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
      console.log('📋 Criando tabela de configurações...');
      await client.query(`
        CREATE TABLE configuracoes_sistema (
          id SERIAL PRIMARY KEY,
          chave VARCHAR(100) UNIQUE NOT NULL,
          valor TEXT,
          descricao TEXT,
          data_criacao TIMESTAMP DEFAULT NOW(),
          data_atualizacao TIMESTAMP DEFAULT NOW()
        );
      `);
    }
    
    // 2. Inserir ou atualizar configuração para desabilitar validações
    const upsertQuery = `
      INSERT INTO configuracoes_sistema (chave, valor, descricao)
      VALUES ('validacoes_status_habilitadas', 'false', 'Controla se as validações de transição de status estão habilitadas')
      ON CONFLICT (chave) 
      DO UPDATE SET 
        valor = EXCLUDED.valor,
        data_atualizacao = NOW()
      RETURNING *;
    `;
    
    const result = await client.query(upsertQuery);
    console.log('✅ Validações de status desabilitadas temporariamente');
    console.log('📋 Configuração atualizada:', result.rows[0]);
    
    // 3. Verificar configuração atual
    const checkConfigQuery = `
      SELECT chave, valor, descricao 
      FROM configuracoes_sistema 
      WHERE chave = 'validacoes_status_habilitadas';
    `;
    
    const config = await client.query(checkConfigQuery);
    console.log('🔍 Configuração atual:', config.rows[0]);
    
    console.log('⚠️  IMPORTANTE:');
    console.log('⚠️  - As validações de status estão DESABILITADAS');
    console.log('⚠️  - Use com cuidado para corrigir dados inconsistentes');
    console.log('⚠️  - Lembre-se de reabilitar após a correção');
    console.log('⚠️  - Execute o script reabilitar_validacoes.js quando terminar');
    
  } catch (error) {
    console.error('❌ Erro ao desabilitar validações:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o script
desabilitarValidacoes().then(() => {
  console.log('🎉 Script concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 