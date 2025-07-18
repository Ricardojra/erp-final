-- Script SQL CONFIGURÁVEL para corrigir notas fiscais
-- Execute este script diretamente no PostgreSQL
-- 
-- INSTRUÇÕES:
-- 1. Escolha uma das opções abaixo (descomente apenas uma)
-- 2. Execute o script
-- 3. Verifique os resultados

-- ==============================================================================
-- OPÇÃO 1: UMA NOTA ESPECÍFICA
-- ==============================================================================
-- Descomente a linha abaixo e altere o número da nota:
-- WHERE numero_nota = '60572'

-- ==============================================================================
-- OPÇÃO 2: VÁRIAS NOTAS ESPECÍFICAS
-- ==============================================================================
-- Descomente a linha abaixo e ajuste os números das notas:
-- WHERE numero_nota IN ('3986', '3991', '3999', '4009', '4011', '4025', '4031', '4037', '4039', '4045', '4052', '4065', '4381', '4382', '4385', '4386', '4387', '4390', '4391', '4401', '4447', '4464', '4466', '4482', '4484', '4485', '4487', '4500', '4504', '4522', '4524')

-- ==============================================================================
-- OPÇÃO 3: TODAS AS NOTAS VENDIDAS
-- ==============================================================================
-- Descomente a linha abaixo:
-- WHERE status = 'vendida'

-- ==============================================================================
-- EXECUÇÃO DO SCRIPT (NÃO ALTERE ABAIXO)
-- ==============================================================================

-- 1. Verificar status atual das notas
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra
FROM notas_fiscais 
WHERE numero_nota IN ('3986', '3991', '3999', '4009', '4011', '4025', '4031', '4037', '4039', '4045', '4052', '4065', '4381', '4382', '4385', '4386', '4387', '4390', '4391', '4401', '4447', '4464', '4466', '4482', '4484', '4485', '4487', '4500', '4504', '4522', '4524')
ORDER BY numero_nota;

-- 2. Contar quantas notas serão afetadas
SELECT 
    COUNT(*) as total_notas_para_corrigir
FROM notas_fiscais 
WHERE numero_nota IN ('3986', '3991', '3999', '4009', '4011', '4025', '4031', '4037', '4039', '4045', '4052', '4065', '4381', '4382', '4385', '4386', '4387', '4390', '4391', '4401', '4447', '4464', '4466', '4482', '4484', '4485', '4487', '4500', '4504', '4522', '4524');

-- 3. Iniciar transação
BEGIN;

-- 4. Desvincular itens da venda (se houver)
UPDATE itens_notas_fiscais 
SET venda_id = NULL 
WHERE nota_fiscal_id IN (
    SELECT id FROM notas_fiscais 
    WHERE numero_nota IN ('3986', '3991', '3999', '4009', '4011', '4025', '4031', '4037', '4039', '4045', '4052', '4065', '4381', '4382', '4385', '4386', '4387', '4390', '4391', '4401', '4447', '4464', '4466', '4482', '4484', '4485', '4487', '4500', '4504', '4522', '4524')
);

-- 5. Alterar status para disponível
UPDATE notas_fiscais 
SET status = 'disponivel', 
    numero_pedido_compra = NULL 
WHERE numero_nota IN ('3986', '3991', '3999', '4009', '4011', '4025', '4031', '4037', '4039', '4045', '4052', '4065', '4381', '4382', '4385', '4386', '4387', '4390', '4391', '4401', '4447', '4464', '4466', '4482', '4484', '4485', '4487', '4500', '4504', '4522', '4524');

-- 6. Confirmar transação
COMMIT;

-- 7. Verificar resultado final
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra
FROM notas_fiscais 
WHERE numero_nota IN ('3986', '3991', '3999', '4009', '4011', '4025', '4031', '4037', '4039', '4045', '4052', '4065', '4381', '4382', '4385', '4386', '4387', '4390', '4391', '4401', '4447', '4464', '4466', '4482', '4484', '4485', '4487', '4500', '4504', '4522', '4524')
ORDER BY numero_nota;

-- 8. Verificar se não há mais vínculos de venda
SELECT 
    COUNT(*) as total_vinculos_restantes
FROM itens_notas_fiscais 
WHERE nota_fiscal_id IN (
    SELECT id FROM notas_fiscais 
    WHERE numero_nota IN ('3986', '3991', '3999', '4009', '4011', '4025', '4031', '4037', '4039', '4045', '4052', '4065', '4381', '4382', '4385', '4386', '4387', '4390', '4391', '4401', '4447', '4464', '4466', '4482', '4484', '4485', '4487', '4500', '4504', '4522', '4524')
) AND venda_id IS NOT NULL;

-- 9. Resumo final
SELECT 
    status,
    COUNT(*) as total
FROM notas_fiscais 
GROUP BY status 
ORDER BY total DESC; 