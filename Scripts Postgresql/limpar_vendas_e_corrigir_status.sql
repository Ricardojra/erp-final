-- Script para limpar vendas e corrigir status das notas fiscais
-- Este script vai limpar a tabela vendas e garantir que o status das notas seja consistente

-- 1. Verificar o estado atual antes da limpeza
SELECT '=== ESTADO ATUAL ===' as info;

SELECT 
    'Vendas existentes' as tipo,
    COUNT(*) as total
FROM vendas;

SELECT 
    'Notas com status vendida' as tipo,
    COUNT(*) as total
FROM notas_fiscais 
WHERE status = 'vendida';

SELECT 
    'Itens vinculados a vendas' as tipo,
    COUNT(*) as total
FROM itens_notas_fiscais 
WHERE venda_id IS NOT NULL;

-- 2. Iniciar transação para garantir consistência
BEGIN;

-- 3. Desvincular todos os itens de vendas
UPDATE itens_notas_fiscais 
SET venda_id = NULL 
WHERE venda_id IS NOT NULL;

-- 4. Limpar número do pedido de compra das notas fiscais
UPDATE notas_fiscais 
SET numero_pedido_compra = NULL 
WHERE numero_pedido_compra IS NOT NULL;

-- 5. Alterar status de todas as notas 'vendida' para 'disponivel'
UPDATE notas_fiscais 
SET status = 'disponivel' 
WHERE status = 'vendida';

-- 6. Limpar a tabela vendas
DELETE FROM vendas;

-- 7. Verificar o estado após a limpeza
SELECT '=== ESTADO APÓS LIMPEZA ===' as info;

SELECT 
    'Vendas existentes' as tipo,
    COUNT(*) as total
FROM vendas;

SELECT 
    'Notas com status vendida' as tipo,
    COUNT(*) as total
FROM notas_fiscais 
WHERE status = 'vendida';

SELECT 
    'Itens vinculados a vendas' as tipo,
    COUNT(*) as total
FROM itens_notas_fiscais 
WHERE venda_id IS NOT NULL;

-- 8. Verificar especificamente a nota 60572
SELECT 
    '=== NOTA 60572 ===' as info;

SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra
FROM notas_fiscais 
WHERE numero_nota = '60572';

-- 9. Confirmar transação
COMMIT;

-- 10. Verificação final
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 
    'Total de vendas' as tipo,
    COUNT(*) as total
FROM vendas;

SELECT 
    'Notas disponíveis' as tipo,
    COUNT(*) as total
FROM notas_fiscais 
WHERE status = 'disponivel';

SELECT 
    'Notas vendidas' as tipo,
    COUNT(*) as total
FROM notas_fiscais 
WHERE status = 'vendida';

SELECT 
    'Itens sem vínculo de venda' as tipo,
    COUNT(*) as total
FROM itens_notas_fiscais 
WHERE venda_id IS NULL;

SELECT 
    'Itens com vínculo de venda' as tipo,
    COUNT(*) as total
FROM itens_notas_fiscais 
WHERE venda_id IS NOT NULL; 