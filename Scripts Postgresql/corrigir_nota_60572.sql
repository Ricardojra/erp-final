-- Script para corrigir o status da nota 60572
-- Este script verifica se a nota está inconsistente e a corrige

-- 1. Verificar o status atual da nota 60572
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra
FROM notas_fiscais 
WHERE numero_nota = '60572';

-- 2. Verificar se há vendas associadas à nota 60572
SELECT 
    v.id as venda_id,
    v.cliente_nome,
    v.numero_pedido_compra,
    v.data_venda,
    nf.numero_nota,
    nf.status
FROM vendas v
JOIN itens_notas_fiscais inf ON v.id = inf.venda_id
JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
WHERE nf.numero_nota = '60572';

-- 3. Se a nota estiver com status 'disponivel' mas tiver vendas associadas, corrigir para 'vendida'
UPDATE notas_fiscais 
SET status = 'vendida'
WHERE numero_nota = '60572' 
AND status = 'disponivel'
AND EXISTS (
    SELECT 1 
    FROM itens_notas_fiscais inf 
    JOIN vendas v ON inf.venda_id = v.id 
    WHERE inf.nota_fiscal_id = notas_fiscais.id
);

-- 4. Se a nota estiver com status 'vendida' mas não tiver vendas associadas, corrigir para 'disponivel'
UPDATE notas_fiscais 
SET status = 'disponivel'
WHERE numero_nota = '60572' 
AND status = 'vendida'
AND NOT EXISTS (
    SELECT 1 
    FROM itens_notas_fiscais inf 
    WHERE inf.nota_fiscal_id = notas_fiscais.id 
    AND inf.venda_id IS NOT NULL
);

-- 5. Verificar o resultado da correção
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra
FROM notas_fiscais 
WHERE numero_nota = '60572';

-- 6. Verificar se há inconsistências restantes
SELECT 
    nf.numero_nota,
    nf.status,
    COUNT(inf.id) as total_itens,
    COUNT(CASE WHEN inf.venda_id IS NOT NULL THEN 1 END) as itens_vendidos,
    CASE 
        WHEN nf.status = 'vendida' AND COUNT(CASE WHEN inf.venda_id IS NOT NULL THEN 1 END) = 0 
        THEN 'INCONSISTENTE: Vendida sem vendas'
        WHEN nf.status = 'disponivel' AND COUNT(CASE WHEN inf.venda_id IS NOT NULL THEN 1 END) > 0 
        THEN 'INCONSISTENTE: Disponível com vendas'
        ELSE 'OK'
    END as status_consistencia
FROM notas_fiscais nf
LEFT JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
WHERE nf.numero_nota = '60572'
GROUP BY nf.id, nf.numero_nota, nf.status; 