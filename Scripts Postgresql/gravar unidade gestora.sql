-- Adicionar a coluna unidade_gestora (se ainda não existir)
ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS unidade_gestora VARCHAR(50);

-- Atualizar todos os registros com o valor 'AXEL'
UPDATE notas_fiscais
SET unidade_gestora = 'AXEL';