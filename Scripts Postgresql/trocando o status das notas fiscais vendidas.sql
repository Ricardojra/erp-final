
SELECT * FROM notas_fiscais
ORDER BY id ASC

ROLLBACK;

-- Step 1: Inspect rows before update (treating numero_nota as string)
SELECT id, numero_nota, status
FROM notas_fiscais
WHERE numero_nota IN ('3015', '3007', '2873', '2853', '2843', '2830')
ORDER BY id ASC;

-- Step 2: Update status within a transaction
BEGIN;
UPDATE notas_fiscais
SET status = 'disponivel'
WHERE numero_nota IN ('3015', '3007', '2873', '2853', '2843', '2830')
AND status = 'vendida'
RETURNING id, numero_nota, status;
COMMIT;

-- Step 3: Inspect rows after update
SELECT id, numero_nota, status
FROM notas_fiscais
WHERE numero_nota IN ('3015', '3007', '2873', '2853', '2843', '2830')
ORDER BY id ASC;