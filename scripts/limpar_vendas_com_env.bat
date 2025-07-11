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

echo Executando limpeza...
echo Digite a senha do PostgreSQL quando solicitado:
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "limpar_vendas_e_corrigir_status.sql"
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha na limpeza das vendas
    echo Verifique se:
    echo - PostgreSQL está rodando
    echo - As credenciais estão corretas
    echo - O banco '%DB_NAME%' existe
    echo - O arquivo 'limpar_vendas_e_corrigir_status.sql' está na pasta raiz
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