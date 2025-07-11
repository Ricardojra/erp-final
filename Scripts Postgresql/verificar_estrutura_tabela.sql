-- Script para verificar e corrigir a estrutura da tabela notas_fiscais
-- Execute este script no PostgreSQL para garantir que a tabela tenha todas as colunas necessárias

-- 1. Verificar estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
ORDER BY ordinal_position;

-- 2. Verificar se a coluna data_atualizacao existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas_fiscais' 
    AND column_name = 'data_atualizacao'
) as coluna_existe;

-- 3. Adicionar coluna data_atualizacao se não existir
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

-- 4. Verificar se a coluna foi adicionada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
AND column_name = 'data_atualizacao';

-- 5. Atualizar data_atualizacao para registros existentes
UPDATE notas_fiscais 
SET data_atualizacao = NOW() 
WHERE data_atualizacao IS NULL;

-- 6. Verificar status das notas que estão com problemas
SELECT 
    id,
    numero_nota,
    status,
    unidade_gestora,
    numero_pedido_compra,
    data_atualizacao
FROM notas_fiscais 
WHERE numero_nota IN ('4524', '60572')
ORDER BY numero_nota; 