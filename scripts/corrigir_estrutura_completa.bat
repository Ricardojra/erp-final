@echo off
echo ========================================
echo Corrigindo estrutura completa do banco
echo ========================================

REM Configurações do banco de dados
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=axel_erp
set DB_USER=postgres
set DB_PASS=postgres

echo.
echo 1. Corrigindo estrutura de vendas...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "Scripts Postgresql/corrigir_estrutura_vendas.sql"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Estrutura de vendas corrigida com sucesso!
) else (
    echo ❌ Erro ao corrigir estrutura de vendas!
    pause
    exit /b 1
)

echo.
echo 2. Verificando pedidos de compra...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "Scripts Postgresql/verificar_pedido_compra_notas_fiscais.sql"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Pedidos de compra verificados com sucesso!
) else (
    echo ❌ Erro ao verificar pedidos de compra!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Todos os scripts executados com sucesso!
echo ========================================
echo.
echo Estrutura do banco de dados atualizada:
echo - Coluna valor_unitario adicionada à itens_notas_fiscais
echo - Coluna venda_id adicionada à itens_notas_fiscais
echo - Tabela vendas criada/atualizada
echo - Colunas de pedido de compra adicionadas
echo - Índices criados para melhor performance
echo.
pause 