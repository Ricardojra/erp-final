-- Script para atualizar valores unitários dos itens existentes
-- Este script define valores padrão por tonelada baseados no tipo de material

-- 1. Definir valores padrão por material (R$/tonelada)
-- Estes valores são estimativas e devem ser ajustados conforme necessário

-- Papel: R$ 800,00/ton
UPDATE itens_notas_fiscais 
SET valor_unitario = 800.00 
WHERE material = 'Papel' AND (valor_unitario IS NULL OR valor_unitario = 0);

-- Papelão: R$ 600,00/ton
UPDATE itens_notas_fiscais 
SET valor_unitario = 600.00 
WHERE material = 'Papelão' AND (valor_unitario IS NULL OR valor_unitario = 0);

-- Vidro: R$ 1200,00/ton
UPDATE itens_notas_fiscais 
SET valor_unitario = 1200.00 
WHERE material = 'Vidro' AND (valor_unitario IS NULL OR valor_unitario = 0);

-- Metal: R$ 1500,00/ton
UPDATE itens_notas_fiscais 
SET valor_unitario = 1500.00 
WHERE material = 'Metal' AND (valor_unitario IS NULL OR valor_unitario = 0);

-- Plástico: R$ 1000,00/ton
UPDATE itens_notas_fiscais 
SET valor_unitario = 1000.00 
WHERE material = 'Plástico' AND (valor_unitario IS NULL OR valor_unitario = 0);

-- 2. Para materiais não classificados, usar valor padrão de R$ 800,00/ton
UPDATE itens_notas_fiscais 
SET valor_unitario = 800.00 
WHERE (material IS NULL OR material = '') AND (valor_unitario IS NULL OR valor_unitario = 0);

-- 3. Verificar os resultados
SELECT 
    material,
    COUNT(*) as total_itens,
    AVG(valor_unitario) as valor_unitario_medio,
    MIN(valor_unitario) as valor_minimo,
    MAX(valor_unitario) as valor_maximo
FROM itens_notas_fiscais 
GROUP BY material
ORDER BY material;

-- 4. Mostrar alguns exemplos de itens atualizados
SELECT 
    id,
    material,
    quantidade,
    valor_unitario,
    (quantidade / 1000) as quantidade_ton,
    (valor_unitario * (quantidade / 1000)) as valor_total_estimado
FROM itens_notas_fiscais 
WHERE valor_unitario > 0
ORDER BY id
LIMIT 10; 