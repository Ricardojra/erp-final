
SELECT vendas,

SELECT material, status, SUM(quantidade) AS total_estoque
FROM itens_notas_fiscais,notas_fiscais
GROUP BY material, status

SELECT * FROM public.itens_notas_fiscais
ORDER BY id ASC

SELECT * FROM public.notas_fiscais
ORDER BY id ASC

SELECT nf.numero_nota, nf.status, inf.material, inf.quantidade
FROM notas_fiscais nf
JOIN itens_notas_fiscais inf ON inf.nota_fiscal_id = nf.id
LIMIT 100;