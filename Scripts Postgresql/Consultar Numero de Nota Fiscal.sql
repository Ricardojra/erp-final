SELECT 
    nf.numero_nota,
    nf.data_emissao,
    nf.emitente_nome AS cnpj_nome,
    nf.status, -- Incluído o status da nota fiscal
	inf.quantidade,
    inf.unidade,
	inf.material
	
FROM 
    notas_fiscais nf
JOIN 
    itens_notas_fiscais inf
ON 
    nf.id = inf.nota_fiscal_id
WHERE 
    nf.numero_nota = '5261';

	