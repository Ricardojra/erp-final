-- Script SQL SIMPLES para corrigir a nota fiscal 60572
-- Execute este script diretamente no PostgreSQL

-- 1. Verificar status atual da nota 60572
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra
FROM notas_fiscais 
WHERE numero_nota = '60572';

-- 2. Iniciar transação
BEGIN;

-- 3. Desvincular itens da venda (se houver)
UPDATE itens_notas_fiscais 
SET venda_id = NULL 
WHERE nota_fiscal_id = (
    SELECT id FROM notas_fiscais WHERE numero_nota = '60572'
);

-- 4. Alterar status para disponível
UPDATE notas_fiscais 
SET status = 'disponivel', 
    numero_pedido_compra = NULL 
WHERE numero_nota = '60572';

-- 5. Confirmar transação
COMMIT;

-- 6. Verificar resultado final
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra
FROM notas_fiscais 
WHERE numero_nota = '60572';

-- 7. Verificar se não há mais vínculos de venda
SELECT 
    COUNT(*) as total_vinculos_restantes
FROM itens_notas_fiscais 
WHERE nota_fiscal_id = (
    SELECT id FROM notas_fiscais WHERE numero_nota = '60572'
) AND venda_id IS NOT NULL; 