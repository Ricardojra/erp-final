-- Script para criar a tabela de auditoria de notas fiscais
-- Esta tabela registra todas as alterações feitas nas notas fiscais

CREATE TABLE IF NOT EXISTS public.auditoria_notas_fiscais (
    id SERIAL PRIMARY KEY,
    nota_fiscal_id INTEGER NOT NULL,
    campo_alterado VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    usuario_id INTEGER,
    ip VARCHAR(45),
    data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Chave estrangeira para a tabela de notas_fiscais
    CONSTRAINT fk_auditoria_nota_fiscal 
        FOREIGN KEY (nota_fiscal_id) 
        REFERENCES public.notas_fiscais(id)
        ON DELETE CASCADE
);

-- Comentários para documentação
COMMENT ON TABLE public.auditoria_notas_fiscais IS 'Registra alterações feitas nas notas fiscais para fins de auditoria';
COMMENT ON COLUMN public.auditoria_notas_fiscais.id IS 'Identificador único do registro de auditoria';
COMMENT ON COLUMN public.auditoria_notas_fiscais.nota_fiscal_id IS 'ID da nota fiscal que foi alterada';
COMMENT ON COLUMN public.auditoria_notas_fiscais.campo_alterado IS 'Nome do campo que foi alterado (ex: status, unidade_gestora)';
COMMENT ON COLUMN public.auditoria_notas_fiscais.valor_anterior IS 'Valor anterior do campo';
COMMENT ON COLUMN public.auditoria_notas_fiscais.valor_novo IS 'Novo valor do campo';
COMMENT ON COLUMN public.auditoria_notas_fiscais.usuario_id IS 'ID do usuário que realizou a alteração (se disponível)';
COMMENT ON COLUMN public.auditoria_notas_fiscais.ip IS 'Endereço IP de onde a alteração foi feita';
COMMENT ON COLUMN public.auditoria_notas_fiscais.data_alteracao IS 'Data e hora em que a alteração foi registrada';

-- Índice para melhorar consultas por nota_fiscal_id
CREATE INDEX IF NOT EXISTS idx_auditoria_nota_fiscal_id 
ON public.auditoria_notas_fiscais(nota_fiscal_id);

-- Índice para consultas por data de alteração
CREATE INDEX IF NOT EXISTS idx_auditoria_data_alteracao 
ON public.auditoria_notas_fiscais(data_alteracao);

-- Permissões
GRANT SELECT, INSERT ON public.auditoria_notas_fiscais TO postgres;

-- Comentário para o índice
COMMENT ON INDEX public.idx_auditoria_nota_fiscal_id IS 'Índice para melhorar consultas por ID da nota fiscal';
COMMENT ON INDEX public.idx_auditoria_data_alteracao IS 'Índice para melhorar consultas por data de alteração';
