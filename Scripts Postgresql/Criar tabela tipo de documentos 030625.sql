CREATE TABLE IF NOT EXISTS tipos_documento (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    requer_validade BOOLEAN NOT NULL DEFAULT FALSE
);

-- Inserir os tipos de documentos iniciais
INSERT INTO tipos_documento (nome, requer_validade) VALUES
('Contrato Social ou Estatuto', FALSE),
('Alvará de Funcionamento', TRUE),
('Certificado de calibração de balança', TRUE),
('Registro Fotográfico', FALSE),
('Registro Fotográfico da Operação', FALSE),
('Licença Ambiental', TRUE),
('Alvará do Corpo de Bombeiros', TRUE),
('Foto da Área de Triagem', FALSE),
('Foto do Armazenamento/Disposição do Material', FALSE),
('Foto da Saída dos Materiais', FALSE),
('Foto dos Equipamentos', FALSE)
ON CONFLICT (nome) DO NOTHING; -- Evita inserir duplicatas se o script for executado novamente
