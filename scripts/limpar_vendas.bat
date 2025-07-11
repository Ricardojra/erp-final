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
echo Executando limpeza...
echo.
echo Configurações do PostgreSQL:
echo - Host: localhost
echo - Porta: 5432
echo - Usuário: postgres
echo - Banco: gestao_estoque
echo.
echo Digite a senha do PostgreSQL quando solicitado:
psql -h localhost -p 5432 -U postgres -d gestao_estoque -f "limpar_vendas_e_corrigir_status.sql"
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha na limpeza das vendas
    echo Verifique se:
    echo - PostgreSQL está rodando
    echo - As credenciais estão corretas
    echo - O banco 'gestao_estoque' existe
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