SELECT * FROM notas_fiscais
ORDER BY id ASC

SELECT * FROM itens_notas_fiscais
ORDER BY id ASC

SELECT *
FROM itens_notas_fiscais
WHERE material NOT IN ('METAL', 'VIDRO', 'PAPEL', 'PAPELÃO', 'PLÁSTICOS')
ORDER BY id ASC;

SELECT * FROM auditoria_notas_fiscais
ORDER BY id ASC 

SELECT * FROM cfop_regras
ORDER BY id ASC

SELECT * FROM classificacao_ncm
ORDER BY id ASC


SELECT * FROM clientes
ORDER BY id ASC

SELECT * FROM documentos
ORDER BY id ASC

SELECT * FROM tipos_documento

SELECT * FROM log_importacao
ORDER BY id ASC

SELECT * FROM produtos_aprovados
ORDER BY id ASC 

SELECT * FROM produtos_permitidos
ORDER BY id ASC 

SELECT * FROM usuarios
ORDER BY id ASC

SELECT * FROM vendas
ORDER BY id ASC

UPDATE vendas
SET valor_por_tonelada = 50.00 -- coloque aqui o valor correto
WHERE id = 8; -- coloque aqui o ID da venda que deseja corrigir


