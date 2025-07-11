-- Script para verificar o status das notas fiscais e seus vínculos com vendas
-- Útil para depuração e validação do sistema

-- 1. Contagem de notas por status
SELECT 
    status, 
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM 
    public.notas_fiscais
GROUP BY 
    status
ORDER BY 
    total DESC;

-- 2. Notas com status 'vendida' e seus vínculos
SELECT 
    nf.id as nota_fiscal_id,
    nf.numero_nota,
    nf.status,
    nf.unidade_gestora,
    v.id as venda_id,
    v.numero_venda,
    v.data_venda,
    v.cliente_final,
    v.numero_nf_servico,
    COUNT(inf.id) as itens_vinculados
FROM 
    public.notas_fiscais nf
LEFT JOIN 
    public.itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
LEFT JOIN 
    public.vendas v ON inf.venda_id = v.id
WHERE 
    nf.status = 'vendida'
GROUP BY 
    nf.id, nf.numero_nota, nf.status, nf.unidade_gestora, v.id, v.numero_venda, v.data_venda, v.cliente_final, v.numero_nf_servico
ORDER BY 
    v.data_venda DESC, nf.numero_nota
LIMIT 50;

-- 3. Notas com status 'disponivel' que já foram vendidas (inconsistência)
SELECT 
    nf.id as nota_fiscal_id,
    nf.numero_nota,
    nf.status,
    nf.unidade_gestora,
    COUNT(inf.id) as itens_vinculados,
    STRING_AGG(DISTINCT v.numero_venda::text, ', ') as numeros_venda
FROM 
    public.notas_fiscais nf
JOIN 
    public.itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
JOIN 
    public.vendas v ON inf.venda_id = v.id
WHERE 
    nf.status = 'disponivel'
GROUP BY 
    nf.id, nf.numero_nota, nf.status, nf.unidade_gestora
ORDER BY 
    nf.numero_nota;

-- 4. Últimas alterações de status registradas na auditoria
SELECT 
    anf.id as auditoria_id,
    anf.nota_fiscal_id,
    nf.numero_nota,
    anf.campo_alterado,
    anf.valor_anterior,
    anf.valor_novo,
    anf.ip,
    anf.data_alteracao
FROM 
    public.auditoria_notas_fiscais anf
JOIN 
    public.notas_fiscais nf ON anf.nota_fiscal_id = nf.id
ORDER BY 
    anf.data_alteracao DESC
LIMIT 20;

-- 5. Verificar notas com status 'vendida' sem vínculo com vendas (inconsistência)
SELECT 
    nf.id as nota_fiscal_id,
    nf.numero_nota,
    nf.status,
    nf.unidade_gestora,
    nf.data_importacao,
    nf.data_registro
FROM 
    public.notas_fiscais nf
WHERE 
    nf.status = 'vendida'
    AND NOT EXISTS (
        SELECT 1 
        FROM public.itens_notas_fiscais inf 
        JOIN public.vendas v ON inf.venda_id = v.id 
        WHERE inf.nota_fiscal_id = nf.id
    )
ORDER BY 
    nf.data_registro DESC;
