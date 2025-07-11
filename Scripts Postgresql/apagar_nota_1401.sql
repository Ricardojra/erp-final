-- Script para apagar a nota fiscal 1401 do banco de dados PostgreSQL
-- Este script verifica a existência da nota e apaga tanto a nota quanto seus itens

-- ==============================================================================
-- SCRIPT: Apagar Nota Fiscal 1401
-- Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descrição: Remove a nota fiscal 1401 e todos os seus itens do banco de dados
-- ==============================================================================

-- Iniciar transação para garantir consistência
BEGIN;

-- 1. VERIFICAR SE A NOTA FISCAL 1401 EXISTE
DO $$
DECLARE
    nota_id INTEGER;
    item_count INTEGER;
BEGIN
    -- Buscar o ID da nota fiscal 1401
    SELECT id INTO nota_id 
    FROM notas_fiscais 
    WHERE numero_nota = '1401';
    
    -- Verificar se a nota existe
    IF nota_id IS NULL THEN
        RAISE NOTICE 'Nota fiscal 1401 não encontrada no banco de dados.';
        RETURN;
    END IF;
    
    -- Contar quantos itens a nota possui
    SELECT COUNT(*) INTO item_count 
    FROM itens_notas_fiscais 
    WHERE nota_fiscal_id = nota_id;
    
    RAISE NOTICE 'Nota fiscal 1401 encontrada com ID: %', nota_id;
    RAISE NOTICE 'Quantidade de itens a serem removidos: %', item_count;
    
    -- 2. APAGAR OS ITENS DA NOTA FISCAL
    DELETE FROM itens_notas_fiscais 
    WHERE nota_fiscal_id = nota_id;
    
    RAISE NOTICE 'Itens da nota fiscal 1401 removidos com sucesso.';
    
    -- 3. APAGAR A NOTA FISCAL
    DELETE FROM notas_fiscais 
    WHERE id = nota_id;
    
    RAISE NOTICE 'Nota fiscal 1401 removida com sucesso.';
    
END $$;

-- 4. VERIFICAR SE A REMOÇÃO FOI BEM-SUCEDIDA
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCESSO: Nota fiscal 1401 foi removida completamente.'
        ELSE 'ATENÇÃO: Ainda existem registros relacionados à nota 1401.'
    END AS resultado
FROM notas_fiscais 
WHERE numero_nota = '1401';

-- Verificar se não há itens órfãos
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCESSO: Todos os itens da nota 1401 foram removidos.'
        ELSE 'ATENÇÃO: Ainda existem itens órfãos da nota 1401.'
    END AS resultado
FROM itens_notas_fiscais inf
JOIN notas_fiscais nf ON inf.nota_fiscal_id = nf.id
WHERE nf.numero_nota = '1401';

-- Confirmar a transação
COMMIT;

-- ==============================================================================
-- RESUMO DA OPERAÇÃO
-- ==============================================================================
-- Este script:
-- 1. Verifica se a nota fiscal 1401 existe
-- 2. Remove todos os itens relacionados à nota
-- 3. Remove a nota fiscal principal
-- 4. Verifica se a remoção foi bem-sucedida
-- 5. Confirma a transação
-- ============================================================================== 