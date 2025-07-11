-- Script para verificar a estrutura da tabela vendas
-- Execute este script para ver quais colunas existem

-- 1. Verificar estrutura da tabela vendas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendas' 
ORDER BY ordinal_position;

-- 2. Verificar se existem registros na tabela vendas
SELECT COUNT(*) as total_vendas FROM vendas;

-- 3. Mostrar alguns registros de exemplo (se houver)
SELECT * FROM vendas LIMIT 5;

-- 4. Verificar estrutura da tabela itens_notas_fiscais
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'itens_notas_fiscais' 
ORDER BY ordinal_position;

-- 5. Verificar vínculos entre vendas e itens
SELECT 
    COUNT(*) as total_vinculos
FROM vendas v
JOIN itens_notas_fiscais inf ON v.id = inf.venda_id; 