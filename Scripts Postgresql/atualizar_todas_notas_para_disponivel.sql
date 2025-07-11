-- =====================================================
-- SCRIPT: Atualizar Status de Todas as Notas Fiscais para Disponível
-- DESCRIÇÃO: Altera o status de todas as notas fiscais para 'disponível'
-- DATA: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- =====================================================

-- Verificar quantas notas fiscais existem antes da atualização
SELECT 
    COUNT(*) as total_notas,
    status,
    COUNT(*) as quantidade_por_status
FROM notas_fiscais 
GROUP BY status
ORDER BY status;

-- Atualizar todas as notas fiscais para status 'disponível'
UPDATE notas_fiscais 
SET status = 'disponivel' 
WHERE status != 'disponivel';

-- Verificar o resultado da atualização
SELECT 
    COUNT(*) as total_notas,
    status,
    COUNT(*) as quantidade_por_status
FROM notas_fiscais 
GROUP BY status
ORDER BY status;

-- Mostrar uma amostra das notas atualizadas
SELECT 
    id,
    numero_nota,
    chave_nfe,
    status,
    unidade_gestora
FROM notas_fiscais 
ORDER BY id 
LIMIT 10;

-- Confirmar a atualização
SELECT 
    'Atualização concluída!' as mensagem,
    COUNT(*) as total_notas_disponiveis
FROM notas_fiscais 
WHERE status = 'disponivel'; 