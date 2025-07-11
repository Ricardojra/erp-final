-- Atualizar PLÁSTICOS
UPDATE itens_notas_fiscais
SET material = 'PLÁSTICOS'
WHERE ncm IN ('39159000', '39011020');

-- Atualizar PAPELÃO
UPDATE itens_notas_fiscais
SET material = 'PAPELÃO'
WHERE ncm = '47079000';

-- Atualizar PAPEL
UPDATE itens_notas_fiscais
SET material = 'PAPEL'
WHERE ncm = '47071000';

-- Atualizar METAL
UPDATE itens_notas_fiscais
SET material = 'METAL'
WHERE ncm IN ('72041000','76020000', '72162100', '68022300', '72044900','37013031','72042900', '72043000', '72041000', '76020000', '72042900', '72043000');

-- Atualizar VIDRO
UPDATE itens_notas_fiscais
SET material = 'VIDRO'
WHERE ncm = '70010000';


