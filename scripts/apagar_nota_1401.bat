@echo off
echo ========================================
echo SCRIPT PARA APAGAR NOTA FISCAL 1401
echo ========================================
echo.

echo Conectando ao banco de dados PostgreSQL...
echo.

REM Substitua os valores abaixo pelas suas configurações
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=gestao_estoque
set PGUSER=postgres
set PGPASSWORD=sua_senha_aqui

echo Executando script SQL...
psql -f "Scripts Postgresql/apagar_nota_1401.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Script executado com sucesso!
) else (
    echo.
    echo ❌ Erro na execução do script!
)

echo.
echo Pressione qualquer tecla para sair...
pause > nul 