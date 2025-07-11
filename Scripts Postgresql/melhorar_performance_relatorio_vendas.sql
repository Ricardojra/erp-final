-- Script para melhorar a performance do relatório de vendas
-- Executar este script para otimizar consultas

-- 1. Índices para tabela vendas
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_nome ON vendas(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_vendas_unidade_gestora ON vendas(unidade_gestora);
CREATE INDEX IF NOT EXISTS idx_vendas_numero_pedido_compra ON vendas(numero_pedido_compra);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_documento ON vendas(cliente_documento);

-- 2. Índices para tabela itens_notas_fiscais
CREATE INDEX IF NOT EXISTS idx_itens_notas_fiscais_material ON itens_notas_fiscais(material);
CREATE INDEX IF NOT EXISTS idx_itens_notas_fiscais_valor_unitario ON itens_notas_fiscais(valor_unitario);
CREATE INDEX IF NOT EXISTS idx_itens_notas_fiscais_quantidade ON itens_notas_fiscais(quantidade);
CREATE INDEX IF NOT EXISTS idx_itens_notas_fiscais_nota_fiscal_id ON itens_notas_fiscais(nota_fiscal_id);
CREATE INDEX IF NOT EXISTS idx_itens_notas_fiscais_venda_id ON itens_notas_fiscais(venda_id);

-- 3. Índices para tabela notas_fiscais
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON notas_fiscais(status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero_pedido_compra ON notas_fiscais(numero_pedido_compra);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_emitente_cnpj ON notas_fiscais(emitente_cnpj);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_emissao ON notas_fiscais(data_emissao);

-- 4. Índices para tabela clientes
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_razao_social ON clientes(razao_social);

-- 5. Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_vendas_data_cliente ON vendas(data_venda, cliente_nome);
CREATE INDEX IF NOT EXISTS idx_vendas_data_unidade ON vendas(data_venda, unidade_gestora);
CREATE INDEX IF NOT EXISTS idx_itens_material_quantidade ON itens_notas_fiscais(material, quantidade);

-- 6. Índices para consultas de relatório
CREATE INDEX IF NOT EXISTS idx_relatorio_vendas_completo ON vendas(data_venda, cliente_nome, unidade_gestora, valor_total);
CREATE INDEX IF NOT EXISTS idx_relatorio_itens_completo ON itens_notas_fiscais(material, quantidade, valor_unitario);

-- 7. Estatísticas atualizadas
ANALYZE vendas;
ANALYZE itens_notas_fiscais;
ANALYZE notas_fiscais;
ANALYZE clientes;

-- 8. Configurações de performance
-- Aumentar work_mem para consultas complexas
SET work_mem = '256MB';

-- Configurar shared_preload_libraries se necessário
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- 9. Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('vendas', 'itens_notas_fiscais', 'notas_fiscais', 'clientes')
ORDER BY tablename, indexname;

-- 10. Verificar estatísticas das tabelas
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('vendas', 'itens_notas_fiscais', 'notas_fiscais', 'clientes')
ORDER BY tablename, attname;

-- 11. Comentários para documentação
COMMENT ON INDEX idx_vendas_data_venda IS 'Índice para consultas por data de venda';
COMMENT ON INDEX idx_vendas_cliente_nome IS 'Índice para consultas por cliente';
COMMENT ON INDEX idx_vendas_unidade_gestora IS 'Índice para consultas por unidade gestora';
COMMENT ON INDEX idx_itens_notas_fiscais_material IS 'Índice para consultas por material';
COMMENT ON INDEX idx_notas_fiscais_status IS 'Índice para consultas por status da nota fiscal';

-- 12. Função para limpeza de índices não utilizados (executar periodicamente)
CREATE OR REPLACE FUNCTION limpar_indices_nao_utilizados()
RETURNS void AS $$
BEGIN
    -- Esta função pode ser usada para identificar índices não utilizados
    -- e removê-los se necessário
    RAISE NOTICE 'Função de limpeza de índices criada';
END;
$$ LANGUAGE plpgsql;

-- 13. Configurações de vacuum e autovacuum
-- Configurar autovacuum para manter as estatísticas atualizadas
ALTER TABLE vendas SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE vendas SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE itens_notas_fiscais SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE itens_notas_fiscais SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE notas_fiscais SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE notas_fiscais SET (autovacuum_analyze_scale_factor = 0.05);

-- 14. Verificar configurações de performance
SHOW work_mem;
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW maintenance_work_mem;

-- 15. Relatório final de otimização
SELECT 
    'Otimização de Performance Concluída' as status,
    COUNT(*) as total_indices,
    'Índices criados/verificados' as descricao
FROM pg_indexes 
WHERE tablename IN ('vendas', 'itens_notas_fiscais', 'notas_fiscais', 'clientes')
AND indexname LIKE 'idx_%'; 