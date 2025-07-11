-- Consulta para localizar notas fiscais pelo nome do emissor
SELECT 
    nf.numero_nota,
    inf.quantidade,
    inf.unidade,
    inf.material,
    nf.status,
    SUM(inf.quantidade) OVER () AS total_quantidade -- Total somado de todas as quantidades
FROM 
    notas_fiscais nf
JOIN 
    itens_notas_fiscais inf
ON 
    nf.id = inf.nota_fiscal_id
WHERE 
    nf.emitente_nome ILIKE '%RIOPEL%' -- Substitua "NOME_DO_EMISSOR" pelo nome desejado
ORDER BY 
    nf.numero_nota;