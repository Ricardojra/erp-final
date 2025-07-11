@echo off
echo ========================================
echo LIMPEZA DE VENDAS E CORREÇÃO DE STATUS
echo ========================================
echo.
echo ATENÇÃO: Este script vai:
echo - Limpar TODA a tabela vendas
echo - Desvincular todos os itens de vendas
echo - Alterar status de 'vendida' para 'disponivel'
echo - Limpar números de pedido de compra
echo.
echo Deseja continuar? (S/N)
set /p confirm=

if /i "%confirm%" neq "S" (
    echo Operação cancelada pelo usuário.
    pause
    exit /b 0
)

echo.
echo Verificando configurações do banco...

REM Verificar se existe arquivo .env
if exist ".env" (
    echo Arquivo .env encontrado, carregando configurações...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="DB_HOST" set DB_HOST=%%b
        if "%%a"=="DB_PORT" set DB_PORT=%%b
        if "%%a"=="DB_USER" set DB_USER=%%b
        if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
        if "%%a"=="DB_NAME" set DB_NAME=%%b
    )
    
    echo Configurações carregadas:
    echo - Host: %DB_HOST%
    echo - Porta: %DB_PORT%
    echo - Usuário: %DB_USER%
    echo - Banco: %DB_NAME%
    echo.
) else (
    echo Arquivo .env não encontrado, usando configurações padrão:
    set DB_HOST=localhost
    set DB_PORT=5432
    set DB_USER=postgres
    set DB_NAME=gestao_estoque
    echo - Host: %DB_HOST%
    echo - Porta: %DB_PORT%
    echo - Usuário: %DB_USER%
    echo - Banco: %DB_NAME%
    echo.
)

echo Procurando PostgreSQL...
echo.

REM Tentar diferentes caminhos para o psql
set PSQL_FOUND=0

REM Tentar psql no PATH
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo PostgreSQL encontrado no PATH
    set PSQL_FOUND=1
    goto :execute_psql
)

REM Tentar caminhos comuns do PostgreSQL
echo Procurando PostgreSQL em caminhos comuns...

REM Caminho padrão do PostgreSQL
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    echo PostgreSQL encontrado em C:\Program Files\PostgreSQL\15\bin\
    set "PSQL_PATH=C:\Program Files\PostgreSQL\15\bin\psql.exe"
    set PSQL_FOUND=1
    goto :execute_psql
)

if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    echo PostgreSQL encontrado em C:\Program Files\PostgreSQL\14\bin\
    set "PSQL_PATH=C:\Program Files\PostgreSQL\14\bin\psql.exe"
    set PSQL_FOUND=1
    goto :execute_psql
)

if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
    echo PostgreSQL encontrado em C:\Program Files\PostgreSQL\13\bin\
    set "PSQL_PATH=C:\Program Files\PostgreSQL\13\bin\psql.exe"
    set PSQL_FOUND=1
    goto :execute_psql
)

if exist "C:\Program Files\PostgreSQL\12\bin\psql.exe" (
    echo PostgreSQL encontrado em C:\Program Files\PostgreSQL\12\bin\
    set "PSQL_PATH=C:\Program Files\PostgreSQL\12\bin\psql.exe"
    set PSQL_FOUND=1
    goto :execute_psql
)

REM Se não encontrou, mostrar alternativas
echo.
echo ERRO: PostgreSQL não encontrado!
echo.
echo ALTERNATIVAS:
echo.
echo 1. Execute o script SQL diretamente no pgAdmin:
echo    - Abra o pgAdmin
echo    - Conecte ao banco gestao_estoque
echo    - Abra o arquivo: limpar_vendas_simples.sql
echo    - Execute (F5)
echo.
echo 2. Adicione o PostgreSQL ao PATH:
echo    - Vá em: Painel de Controle > Sistema > Variáveis de Ambiente
echo    - Em "Variáveis do Sistema", encontre "Path"
echo    - Adicione: C:\Program Files\PostgreSQL\15\bin\
echo    - (Ajuste a versão conforme necessário)
echo.
echo 3. Execute manualmente via psql:
echo    - Abra o prompt de comando
echo    - Navegue até: C:\Program Files\PostgreSQL\15\bin\
echo    - Execute: psql -h localhost -U postgres -d gestao_estoque -f "C:\app_axel\AXEL ERP 2025 300625\limpar_vendas_simples.sql"
echo.
pause
exit /b 1

:execute_psql
echo.
echo Executando limpeza...
echo Digite a senha do PostgreSQL quando solicitado:
echo.

if defined PSQL_PATH (
    "%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "limpar_vendas_e_corrigir_status.sql"
) else (
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "limpar_vendas_e_corrigir_status.sql"
)

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha na limpeza das vendas
    echo Verifique se:
    echo - PostgreSQL está rodando
    echo - As credenciais estão corretas
    echo - O banco '%DB_NAME%' existe
    echo - O arquivo 'limpar_vendas_e_corrigir_status.sql' está na pasta raiz
    echo.
    echo Tente executar o script SQL diretamente no pgAdmin
    pause
    exit /b 1
)

echo.
echo ========================================
echo LIMPEZA CONCLUÍDA COM SUCESSO!
echo ========================================
echo.
echo Agora você pode:
echo 1. Registrar novamente o pedido de compra 811
echo 2. Verificar se a nota 60572 aparece corretamente como 'disponivel'
echo 3. Após a venda, verificar se o status muda para 'vendida'
echo.
pause 