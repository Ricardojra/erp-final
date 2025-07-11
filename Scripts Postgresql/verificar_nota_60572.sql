-- Script para verificar especificamente a nota 60572 e seu status
-- Útil para investigar o problema reportado

-- 1. Verificar o status atual da nota 60572
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    data_emissao,
    data_registro,
    numero_pedido_compra
FROM notas_fiscais 
WHERE numero_nota = '60572';

-- 2. Verificar os itens da nota 60572
SELECT 
    inf.id as item_id,
    inf.nota_fiscal_id,
    inf.material,
    inf.quantidade,
    inf.valor_unitario,
    inf.venda_id
FROM itens_notas_fiscais inf
JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
WHERE nf.numero_nota = '60572';

-- 3. Verificar se a nota 60572 está vinculada a alguma venda
SELECT 
    v.id as venda_id,
    v.cliente_nome,
    v.numero_pedido_compra,
    v.data_venda,
    v.valor_total,
    inf.id as item_id,
    inf.material,
    inf.quantidade
FROM vendas v
JOIN itens_notas_fiscais inf ON v.id = inf.venda_id
JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
WHERE nf.numero_nota = '60572';

-- 4. Verificar todas as vendas com pedido de compra 811
SELECT 
    v.id as venda_id,
    v.cliente_nome,
    v.numero_pedido_compra,
    v.data_venda,
    v.valor_total,
    nf.numero_nota,
    nf.status,
    inf.material,
    inf.quantidade
FROM vendas v
JOIN itens_notas_fiscais inf ON v.id = inf.venda_id
JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
WHERE v.numero_pedido_compra = '811'
ORDER BY v.data_venda DESC;

-- 5. Verificar se há inconsistências no status das notas
SELECT 
    nf.numero_nota,
    nf.status,
    COUNT(inf.id) as total_itens,
    COUNT(CASE WHEN inf.venda_id IS NOT NULL THEN 1 END) as itens_vendidos
FROM notas_fiscais nf
LEFT JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
WHERE nf.numero_nota = '60572'
GROUP BY nf.id, nf.numero_nota, nf.status;

-- 6. Verificar o histórico de alterações da nota (se houver auditoria)
SELECT 
    anf.campo_alterado,
    anf.valor_anterior,
    anf.valor_novo,
    anf.data_alteracao,
    anf.ip
FROM auditoria_notas_fiscais anf
JOIN notas_fiscais nf ON anf.nota_fiscal_id = nf.id
WHERE nf.numero_nota = '60572'
ORDER BY anf.data_alteracao DESC; 