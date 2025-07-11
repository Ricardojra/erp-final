SELECT conname, pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'notas_fiscais'::regclass AND conname = 'notas_fiscais_status_check';

-- Remover a restrição existente
ALTER TABLE notas_fiscais DROP CONSTRAINT notas_fiscais_status_check;

-- Adicionar a nova restrição com status atualizados
ALTER TABLE notas_fiscais
ADD CONSTRAINT notas_fiscais_status_check
CHECK (status::text = ANY (ARRAY['disponivel', 'enviada', 'vendida', 'reprovada', 'pendente', 'ofertada']::text[]));


SELECT conname, pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'notas_fiscais'::regclass AND conname = 'notas_fiscais_status_check';