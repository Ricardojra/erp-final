CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY, -- ID único para cada cliente, auto-incrementável
    cnpj VARCHAR(14) UNIQUE NOT NULL, -- CNPJ do cliente, único e obrigatório (chave de ligação com notas_fiscais)
    razao_social VARCHAR(255) NOT NULL, -- Razão social do cliente (nome legal)
    nome_fantasia VARCHAR(255), -- Nome fantasia do cliente (opcional)
    endereco VARCHAR(255), -- Endereço completo
    cidade VARCHAR(100), -- Cidade
    uf VARCHAR(2), -- Estado (UF), ex: 'RJ', 'SP'
    cep VARCHAR(8), -- CEP
    email_contato VARCHAR(255), -- E-mail de contato principal
    telefone_contato VARCHAR(20), -- Telefone de contato principal
    whatsapp_numero VARCHAR(20), -- Número de WhatsApp para notificações
    nome_contato VARCHAR(255), -- NOVO CAMPO: Nome da pessoa de contato na empresa
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Data e hora do cadastro do cliente
    ativo BOOLEAN DEFAULT TRUE -- Indica se o cliente está ativo no sistema (para "soft delete")
);

-- Opcional: Adicionar um índice para busca rápida por razão social ou nome fantasia
CREATE INDEX IF NOT EXISTS idx_clientes_razao_social ON clientes (razao_social);
CREATE INDEX IF NOT EXISTS idx_clientes_nome_fantasia ON clientes (nome_fantasia);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes (cnpj); -- Índice para o CNPJ, que é a chave principal de busca
