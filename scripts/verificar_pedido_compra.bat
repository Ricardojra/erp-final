@echo off
echo ========================================
echo Verificando estrutura de pedidos de compra
echo ========================================

REM Configurações do banco de dados
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=axel_erp
set DB_USER=postgres
set DB_PASS=postgres

echo Executando script de verificacao...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "Scripts Postgresql/verificar_pedido_compra_notas_fiscais.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Script executado com sucesso!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Erro ao executar o script!
    echo ========================================
)

pause 