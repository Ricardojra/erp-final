CREATE TABLE notas_fiscais (
    id SERIAL PRIMARY KEY,
    chave_nfe VARCHAR(44) NOT NULL UNIQUE,
    numero_nota VARCHAR(20) NOT NULL,
    data_emissao DATE NOT NULL,
    emitente_cnpj VARCHAR(14) NOT NULL,
    emitente_nome VARCHAR(255) NOT NULL,
    emitente_uf VARCHAR(2) NOT NULL,
    destinatario_cnpj VARCHAR(14) NOT NULL,
    destinatario_nome VARCHAR(255) NOT NULL,
    destinatario_uf VARCHAR(2) NOT NULL,
    status VARCHAR(50) NOT NULL,
	unidade_gestora VARCHAR(50) NOT NULL
);

CREATE TABLE itens_notas_fiscais (
    id SERIAL PRIMARY KEY,
    nota_fiscal_id INT REFERENCES notas_fiscais(id) ON DELETE CASCADE,
    ncm VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL,
    unidade VARCHAR(10) NOT NULL,
    material VARCHAR(50) NOT NULL
);