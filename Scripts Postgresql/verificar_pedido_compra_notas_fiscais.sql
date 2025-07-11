-- Script para verificar e adicionar a coluna numero_pedido_compra na tabela notas_fiscais
-- Executar este script para garantir que a coluna existe

-- 1. Verificar se a coluna numero_pedido_compra existe na tabela notas_fiscais
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' 
        AND column_name = 'numero_pedido_compra'
    ) THEN
        -- Adicionar a coluna se ela não existir
        ALTER TABLE notas_fiscais ADD COLUMN numero_pedido_compra VARCHAR(50);
        RAISE NOTICE 'Coluna numero_pedido_compra adicionada à tabela notas_fiscais';
    ELSE
        RAISE NOTICE 'Coluna numero_pedido_compra já existe na tabela notas_fiscais';
    END IF;
END $$;

-- 2. Verificar se a coluna numero_pedido_compra existe na tabela vendas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendas' 
        AND column_name = 'numero_pedido_compra'
    ) THEN
        -- Adicionar a coluna se ela não existir
        ALTER TABLE vendas ADD COLUMN numero_pedido_compra VARCHAR(50);
        RAISE NOTICE 'Coluna numero_pedido_compra adicionada à tabela vendas';
    ELSE
        RAISE NOTICE 'Coluna numero_pedido_compra já existe na tabela vendas';
    END IF;
END $$;

-- 3. Criar índice para melhor performance nas consultas por pedido de compra
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero_pedido_compra ON notas_fiscais(numero_pedido_compra);
CREATE INDEX IF NOT EXISTS idx_vendas_numero_pedido_compra ON vendas(numero_pedido_compra);

-- 4. Adicionar comentários para documentação
COMMENT ON COLUMN notas_fiscais.numero_pedido_compra IS 'Número do pedido de compra associado à nota fiscal';
COMMENT ON COLUMN vendas.numero_pedido_compra IS 'Número do pedido de compra da venda';

-- 5. Verificar a estrutura atual das tabelas
SELECT 
    'notas_fiscais' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
AND column_name IN ('numero_pedido_compra')
ORDER BY column_name;

SELECT 
    'vendas' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vendas'
AND column_name IN ('numero_pedido_compra')
ORDER BY column_name;

-- 6. Mostrar algumas estatísticas sobre pedidos de compra
SELECT 
    'Estatísticas de Pedidos de Compra' as info,
    COUNT(*) as total_notas,
    COUNT(CASE WHEN numero_pedido_compra IS NOT NULL THEN 1 END) as notas_com_pedido,
    COUNT(CASE WHEN numero_pedido_compra IS NULL THEN 1 END) as notas_sem_pedido,
    COUNT(DISTINCT numero_pedido_compra) as pedidos_diferentes
FROM notas_fiscais;

SELECT 
    'Pedidos de Compra Mais Frequentes' as info,
    numero_pedido_compra,
    COUNT(*) as quantidade_notas
FROM notas_fiscais 
WHERE numero_pedido_compra IS NOT NULL 
GROUP BY numero_pedido_compra 
ORDER BY quantidade_notas DESC 
LIMIT 10; 