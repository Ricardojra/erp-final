-- Para PostgreSQL:
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public' -- Ou o schema onde sua tabela está, se não for 'public'
    AND table_name = 'itens_notas_fiscais'
ORDER BY
    ordinal_position;

-- Alternativamente, no cliente psql (terminal):
-- \d itens_notas_fiscais
