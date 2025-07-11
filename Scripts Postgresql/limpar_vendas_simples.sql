-- Script simplificado para limpar vendas e corrigir status
-- Execute este script diretamente no pgAdmin ou psql

-- Verificar estado atual
SELECT '=== ESTADO ATUAL ===' as info;
SELECT 'Vendas existentes: ' || COUNT(*) FROM vendas;
SELECT 'Notas vendidas: ' || COUNT(*) FROM notas_fiscais WHERE status = 'vendida';
SELECT 'Itens vinculados: ' || COUNT(*) FROM itens_notas_fiscais WHERE venda_id IS NOT NULL;

-- Iniciar limpeza
BEGIN;

-- Desvincular itens
UPDATE itens_notas_fiscais SET venda_id = NULL WHERE venda_id IS NOT NULL;

-- Limpar pedidos de compra
UPDATE notas_fiscais SET numero_pedido_compra = NULL WHERE numero_pedido_compra IS NOT NULL;

-- Corrigir status
UPDATE notas_fiscais SET status = 'disponivel' WHERE status = 'vendida';

-- Limpar vendas
DELETE FROM vendas;

COMMIT;

-- Verificar resultado
SELECT '=== ESTADO FINAL ===' as info;
SELECT 'Vendas existentes: ' || COUNT(*) FROM vendas;
SELECT 'Notas disponíveis: ' || COUNT(*) FROM notas_fiscais WHERE status = 'disponivel';
SELECT 'Itens sem vínculo: ' || COUNT(*) FROM itens_notas_fiscais WHERE venda_id IS NULL;

-- Verificar nota 60572
SELECT '=== NOTA 60572 ===' as info;
SELECT id, numero_nota, status, unidade_gestora, numero_pedido_compra 
FROM notas_fiscais WHERE numero_nota = '60572'; 