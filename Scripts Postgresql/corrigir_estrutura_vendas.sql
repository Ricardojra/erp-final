-- Script para corrigir a estrutura das tabelas vendas e itens_notas_fiscais
-- Executar este script para adicionar colunas necessárias

-- 1. Adicionar coluna valor_unitario à tabela itens_notas_fiscais
ALTER TABLE itens_notas_fiscais 
ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC(10,2) DEFAULT 0.00;

-- 2. Criar tabela vendas se não existir
CREATE TABLE IF NOT EXISTS vendas (
    id SERIAL PRIMARY KEY,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_documento VARCHAR(18),
    valor_total NUMERIC(10,2) NOT NULL,
    numero_pedido_compra VARCHAR(50),
    unidade_gestora VARCHAR(50),
    data_venda DATE,
    observacoes TEXT,
    numero_nf_servico VARCHAR(50),
    cliente_final VARCHAR(255),
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Adicionar coluna venda_id à tabela itens_notas_fiscais se não existir
ALTER TABLE itens_notas_fiscais 
ADD COLUMN IF NOT EXISTS venda_id INTEGER REFERENCES vendas(id);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_itens_notas_fiscais_venda_id ON itens_notas_fiscais(venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_notas_fiscais_material ON itens_notas_fiscais(material);
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_nome ON vendas(cliente_nome);

-- 5. Comentários para documentação
COMMENT ON COLUMN itens_notas_fiscais.valor_unitario IS 'Valor unitário do item da nota fiscal';
COMMENT ON COLUMN itens_notas_fiscais.venda_id IS 'ID da venda associada ao item (se vendido)';
COMMENT ON TABLE vendas IS 'Tabela para armazenar informações das vendas realizadas';
COMMENT ON COLUMN vendas.cliente_nome IS 'Nome do cliente que realizou a compra';
COMMENT ON COLUMN vendas.valor_total IS 'Valor total da venda';
COMMENT ON COLUMN vendas.numero_pedido_compra IS 'Número do pedido de compra';
COMMENT ON COLUMN vendas.unidade_gestora IS 'Unidade gestora responsável';
COMMENT ON COLUMN vendas.data_venda IS 'Data da venda';
COMMENT ON COLUMN vendas.data_registro IS 'Data e hora do registro da venda no sistema';

-- 6. Verificar se as alterações foram aplicadas
SELECT 
    'itens_notas_fiscais' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'itens_notas_fiscais' 
AND column_name IN ('valor_unitario', 'venda_id')
ORDER BY column_name;

SELECT 
    'vendas' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vendas'
ORDER BY ordinal_position; 