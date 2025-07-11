-- Script SQL para corrigir todas as notas vendidas
-- Execute este script diretamente no PostgreSQL

-- 1. Verificar quantas notas vendidas existem
SELECT 
    status,
    COUNT(*) as total
FROM notas_fiscais 
GROUP BY status 
ORDER BY total DESC;

-- 2. Listar todas as notas vendidas
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra
FROM notas_fiscais 
WHERE status = 'vendida'
ORDER BY numero_nota;

-- 3. Iniciar transação
BEGIN;

-- 4. Desvincular todos os itens de notas vendidas
UPDATE itens_notas_fiscais 
SET venda_id = NULL 
WHERE nota_fiscal_id IN (
    SELECT id FROM notas_fiscais WHERE status = 'vendida'
);

-- 5. Deletar todos os registros de venda de notas vendidas
DELETE FROM vendas 
WHERE numero_pedido_compra IN (
    SELECT numero_pedido_compra 
    FROM notas_fiscais 
    WHERE status = 'vendida' 
    AND numero_pedido_compra IS NOT NULL
);

-- 6. Alterar status de todas as notas vendidas para disponível
UPDATE notas_fiscais 
SET status = 'disponivel', 
    numero_pedido_compra = NULL 
WHERE status = 'vendida';

-- 7. Confirmar transação
COMMIT;

-- 8. Verificar resultado final
SELECT 
    status,
    COUNT(*) as total
FROM notas_fiscais 
GROUP BY status 
ORDER BY total DESC;

-- 9. Verificar se não há mais vínculos de venda
SELECT 
    COUNT(*) as total_vinculos_restantes
FROM vendas v
JOIN itens_notas_fiscais inf ON v.id = inf.venda_id
WHERE inf.nota_fiscal_id IN (
    SELECT id FROM notas_fiscais WHERE status = 'disponivel'
);

-- 10. Mostrar algumas notas corrigidas como exemplo
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra
FROM notas_fiscais 
WHERE status = 'disponivel'
ORDER BY numero_nota
LIMIT 10; 