-- Criação da tabela de lotes para rastreamento de envios
CREATE TABLE IF NOT EXISTS lotes (
    id SERIAL PRIMARY KEY,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    destino VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pendente', -- Pendente, Enviado
    quantidade_total NUMERIC(12,3) NOT NULL,
    usuario_criador VARCHAR(100),
    observacao TEXT
);

-- Adiciona referência de lote nas notas fiscais
ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS lote_id INTEGER REFERENCES lotes(id); 