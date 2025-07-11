-- Script SQL para criação da tabela notas_fiscais no PostgreSQL

CREATE TABLE IF NOT EXISTS notas_fiscais (
    id SERIAL PRIMARY KEY,
    chave_nfe VARCHAR(44) UNIQUE NOT NULL,
    numero_nota VARCHAR(20),
    serie_nota VARCHAR(3),
    data_emissao TIMESTAMP,
    valor_total_nota DECIMAL(15, 2),
    emitente_cnpj VARCHAR(14),
    emitente_nome VARCHAR(255),
    emitente_uf VARCHAR(2),
    destinatario_cnpj VARCHAR(14),
    destinatario_nome VARCHAR(255),
    destinatario_uf VARCHAR(2),
    status VARCHAR(20) NOT NULL CHECK (status IN (	extquotesingle{}disponivel	extquotesingle{}, 	extquotesingle{}enviada	extquotesingle{}, 	extquotesingle{}vendida	extquotesingle{}, 	extquotesingle{}reprovada	extquotesingle{})),
    unidade_gestora VARCHAR(255),
    usuario_responsavel VARCHAR(100),
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar quaisquer outros índices ou constraints aqui, se necessário.
-- Exemplo de índice para otimizar buscas por status:
-- CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON notas_fiscais (status);

-- Exemplo de índice para otimizar buscas por data de emissão:
-- CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_emissao ON notas_fiscais (data_emissao);

COMMENT ON TABLE notas_fiscais IS 	extquotesingle{}Tabela para armazenar informações das notas fiscais eletrônicas.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.id IS 	extquotesingle{}Identificador único da nota fiscal (auto-incrementável).	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.chave_nfe IS 	extquotesingle{}Chave de acesso da NF-e (44 dígitos), única e obrigatória.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.numero_nota IS 	extquotesingle{}Número da nota fiscal.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.serie_nota IS 	extquotesingle{}Série da nota fiscal.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.data_emissao IS 	extquotesingle{}Data e hora de emissão da nota fiscal.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.valor_total_nota IS 	extquotesingle{}Valor total da nota fiscal.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.emitente_cnpj IS 	extquotesingle{}CNPJ do emitente da nota fiscal.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.emitente_nome IS 	extquotesingle{}Nome ou Razão Social do emitente.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.emitente_uf IS 	extquotesingle{}UF do emitente.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.destinatario_cnpj IS 	extquotesingle{}CNPJ do destinatário da nota fiscal.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.destinatario_nome IS 	extquotesingle{}Nome ou Razão Social do destinatário.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.destinatario_uf IS 	extquotesingle{}UF do destinatário.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.status IS 	extquotesingle{}Status atual da nota fiscal no sistema (disponivel, enviada, vendida, reprovada).	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.unidade_gestora IS 	extquotesingle{}Unidade gestora responsável pela nota (pode ser nulo).	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.usuario_responsavel IS 	extquotesingle{}Usuário responsável pelo registro ou última alteração da nota no sistema.	extquotesingle{};
COMMENT ON COLUMN notas_fiscais.data_registro IS 	extquotesingle{}Data e hora em que a nota foi registrada ou teve sua última atualização no sistema.	extquotesingle{};

