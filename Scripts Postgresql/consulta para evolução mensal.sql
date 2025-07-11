SELECT DATE_TRUNC('month', nf.data_emissao) AS mes, SUM(inf.quantidade) / 1000 AS total_toneladas
FROM notas_fiscais nf
JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
GROUP BY mes
ORDER BY mes;