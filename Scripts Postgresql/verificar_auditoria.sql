-- Script para verificar e criar a tabela auditoria_notas_fiscais se não existir

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auditoria_notas_fiscais'
) as tabela_existe;

-- Se a tabela não existir, criar
CREATE TABLE IF NOT EXISTS auditoria_notas_fiscais (
    id SERIAL PRIMARY KEY,
    nota_fiscal_id INTEGER NOT NULL,
    campo_alterado VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    ip VARCHAR(45),
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE
);

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'auditoria_notas_fiscais'
ORDER BY ordinal_position; 