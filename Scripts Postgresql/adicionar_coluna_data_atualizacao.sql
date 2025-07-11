-- Script para adicionar a coluna data_atualizacao na tabela notas_fiscais
-- Execute este script no PostgreSQL

-- 1. Verificar se a coluna já existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas_fiscais' 
    AND column_name = 'data_atualizacao'
) as coluna_existe;

-- 2. Adicionar a coluna se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' 
        AND column_name = 'data_atualizacao'
    ) THEN
        ALTER TABLE notas_fiscais ADD COLUMN data_atualizacao TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna data_atualizacao adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna data_atualizacao já existe';
    END IF;
END $$;

-- 3. Atualizar registros existentes
UPDATE notas_fiscais 
SET data_atualizacao = NOW() 
WHERE data_atualizacao IS NULL;

-- 4. Verificar se foi adicionada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
AND column_name = 'data_atualizacao'; 