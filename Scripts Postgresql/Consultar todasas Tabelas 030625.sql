

SELECT * FROM cfop_regras
ORDER BY id ASC


SELECT * FROM classificacao_ncm
ORDER BY id ASC


SELECT * FROM clientes
ORDER BY id ASC

SELECT * FROM itens_notas_fiscais
ORDER BY id ASC

SELECT *
FROM itens_notas_fiscais
WHERE material NOT IN ('METAL', 'VIDRO', 'PAPEL', 'PAPELÃO', 'PLÁSTICOS')
ORDER BY id ASC;


SELECT * FROM notas_fiscais
ORDER BY id ASC

SELECT * FROM vendas
ORDER BY id ASC

SELECT * FROM documentos
ORDER BY id ASC

SELECT * FROM tipos_documento

