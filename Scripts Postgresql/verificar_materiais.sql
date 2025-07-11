-- Script para verificar a consistência dos nomes dos materiais
-- Lista todos os nomes de materiais distintos e a contagem de cada ocorrência.

SELECT
  material,
  COUNT(*) as quantidade_ocorrencias
FROM
  itens_notas_fiscais
WHERE
  material IS NOT NULL
GROUP BY
  material
ORDER BY
  material;
