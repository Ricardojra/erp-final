-- Script para adicionar a coluna valor_unitario à tabela itens_notas_fiscais
-- Executar este script para adicionar a coluna necessária para o módulo de vendas

-- 1. Verificar se a coluna valor_unitario já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itens_notas_fiscais' 
        AND column_name = 'valor_unitario'
    ) THEN
        -- Adicionar a coluna valor_unitario se não existir
        ALTER TABLE itens_notas_fiscais 
        ADD COLUMN valor_unitario NUMERIC(10,2) DEFAULT 0.00;
        
        RAISE NOTICE 'Coluna valor_unitario adicionada à tabela itens_notas_fiscais';
    ELSE
        RAISE NOTICE 'Coluna valor_unitario já existe na tabela itens_notas_fiscais';
    END IF;
END $$;

-- 2. Adicionar comentário à coluna
COMMENT ON COLUMN itens_notas_fiscais.valor_unitario IS 'Valor unitário por tonelada do item da nota fiscal';

-- 3. Verificar se a alteração foi aplicada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'itens_notas_fiscais' 
AND column_name = 'valor_unitario';

-- 4. Mostrar a estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'itens_notas_fiscais'
ORDER BY ordinal_position; 