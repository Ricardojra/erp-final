-- Step 1: Inspect columns of notas_fiscais
SELECT 
    column_name,
    data_type,
    is_nullable,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM 
    information_schema.columns
WHERE 
    table_name = 'notas_fiscais'
ORDER BY 
    ordinal_position;

-- Step 2: Inspect constraints for notas_fiscais
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    ccu.column_name
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
WHERE 
    tc.table_name = 'notas_fiscais'
ORDER BY 
    tc.constraint_type, tc.constraint_name;

-- Step 3: Inspect columns of itens_notas_fiscais
SELECT 
    column_name,
    data_type,
    is_nullable,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM 
    information_schema.columns
WHERE 
    table_name = 'itens_notas_fiscais'
ORDER BY 
    ordinal_position;

-- Step 4: Inspect constraints for itens_notas_fiscais
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    ccu.column_name
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
WHERE 
    tc.table_name = 'itens_notas_fiscais'
ORDER BY 
    tc.constraint_type, tc.constraint_name;


	ALTER TABLE itens_notas_fiscais
ADD COLUMN venda_id INTEGER REFERENCES vendas(id);


CREATE INDEX idx_itens_notas_fiscais_venda_id ON itens_notas_fiscais(venda_id)