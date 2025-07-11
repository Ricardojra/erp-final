-- ATENÇÃO: Este comando irá APAGAR a tabela documentos existente e todos os seus dados!
-- Use com cautela. Se você tem dados existentes, considere o script ALTER TABLE anterior.
DROP TABLE IF EXISTS documentos CASCADE;

CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    tipo_documento_id INTEGER NOT NULL,
    caminho_arquivo VARCHAR(500) NOT NULL,
    data_validade DATE, -- Pode ser NULL para documentos sem validade
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_upload VARCHAR(100),
    tipo_mime VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,

    -- Chave estrangeira para a tabela clientes
    CONSTRAINT fk_documentos_clientes
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE, -- Se o cliente for excluído, seus documentos também serão
    
    -- Chave estrangeira para a tabela tipos_documento
    CONSTRAINT fk_documentos_tipos_documento
        FOREIGN KEY (tipo_documento_id)
        REFERENCES tipos_documento(id)
        ON DELETE RESTRICT -- Impede a exclusão de um tipo de documento se houver documentos associados
);

-- Opcional: Adicionar índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_id ON documentos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo_documento_id ON documentos (tipo_documento_id);
CREATE INDEX IF NOT EXISTS idx_documentos_data_validade ON documentos (data_validade);

-- Opcional: Adicionar uma restrição UNIQUE para garantir apenas um documento de um tipo por cliente
-- Se você quiser permitir múltiplos uploads do mesmo tipo de documento para o mesmo cliente, remova esta linha.
-- ALTER TABLE documentos ADD CONSTRAINT uq_cliente_tipo_documento UNIQUE (cliente_id, tipo_documento_id);
