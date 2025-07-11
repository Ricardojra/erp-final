@echo off
echo Aplicando alterações no banco de dados para suporte a auditoria de notas fiscais...

set PGPASSWORD=postgres
set PGUSER=postgres
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=gestao_estoque

:: Verifica se o psql está disponível
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Erro: O comando 'psql' não foi encontrado. Certifique-se de que o PostgreSQL está instalado e no PATH.
    pause
    exit /b 1
)

echo Verificando se a tabela auditoria_notas_fiscais já existe...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'auditoria_notas_fiscais'" | find "1 row" >nul

if %ERRORLEVEL% equ 0 (
    echo A tabela auditoria_notas_fiscais já existe. Nenhuma alteração será feita.
    pause
    exit /b 0
)

echo Criando a tabela auditoria_notas_fiscais...

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -c "
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
"

if %ERRORLEVEL% neq 0 (
    echo Erro ao executar o script SQL.
    pause
    exit /b 1
)

echo Tabela auditoria_notas_fiscais criada com sucesso!
echo.
echo Próximos passos:
echo 1. Execute o sistema e teste a alteração de status das notas fiscais
echo 2. Verifique os registros na tabela auditoria_notas_fiscais com a consulta:
echo    SELECT * FROM public.auditoria_notas_fiscais ORDER BY data_alteracao DESC LIMIT 10;

echo.
pause
