-- Script simples para apagar a nota fiscal 1401
-- Versão simplificada do script de remoção

-- Verificar se a nota existe antes de apagar
SELECT 
    nf.id,
    nf.numero_nota,
    nf.emitente_nome,
    nf.data_emissao,
    COUNT(inf.id) as total_itens
FROM notas_fiscais nf
LEFT JOIN itens_notas_fiscais inf ON nf.id = inf.nota_fiscal_id
WHERE nf.numero_nota = '1401'
GROUP BY nf.id, nf.numero_nota, nf.emitente_nome, nf.data_emissao;

-- Apagar os itens da nota fiscal 1401
DELETE FROM itens_notas_fiscais 
WHERE nota_fiscal_id IN (
    SELECT id FROM notas_fiscais WHERE numero_nota = '1401'
);

-- Apagar a nota fiscal 1401
DELETE FROM notas_fiscais 
WHERE numero_nota = '1401';

-- Verificar se a remoção foi bem-sucedida
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCESSO: Nota fiscal 1401 removida'
        ELSE 'ERRO: Nota fiscal 1401 ainda existe'
    END AS status_remocao
FROM notas_fiscais 
WHERE numero_nota = '1401'; 