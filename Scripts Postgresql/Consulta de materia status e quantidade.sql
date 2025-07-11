SELECT inf.material, nf.status, SUM(inf.quantidade) / 1000 AS total_toneladas
FROM itens_notas_fiscais inf
JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
GROUP BY inf.material, nf.status;