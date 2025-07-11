    SELECT 
        numero_nota,
        status,
        unidade_gestora,
        emitente_nome AS nome_emissor
    FROM 
        notas_fiscais
    WHERE 
        numero_nota = '3973'