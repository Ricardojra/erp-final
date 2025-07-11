SELECT tablename FROM pg_tables WHERE schemaname = 'public';

TRUNCATE TABLE cfop_permitidos, itens_notas_fiscais, log_importacao, notas_fiscais, classificacao_ncm  RESTART IDENTITY CASCADE;

DELETE FROM cfop_permitidos;
DELETE FROM itens_notas_fiscais;
DELETE FROM log_importacao;
DELETE FROM notas_fiscais; 
DELETE FROM classificacao_ncm;


SELECT COUNT(*) FROM notas_fiscais
SELECT COUNT(*) FROM cfop_permitidos;
SELECT COUNT(*) FROM itens_notas_fiscais;
SELECT COUNT(*) FROM log_importacao;
SELECT COUNT(*) FROM classificacao_ncm;