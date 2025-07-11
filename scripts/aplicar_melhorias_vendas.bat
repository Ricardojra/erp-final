@echo off
echo ========================================
echo Aplicando melhorias no módulo de vendas
echo ========================================
echo.

echo 1. Adicionando coluna valor_unitario...
psql -h localhost -U postgres -d gestao_estoque -f "adicionar_coluna_valor_unitario.sql"
if %errorlevel% neq 0 (
    echo ERRO: Falha ao adicionar coluna valor_unitario
    pause
    exit /b 1
)

echo.
echo 2. Atualizando valores unitários...
psql -h localhost -U postgres -d gestao_estoque -f "atualizar_valores_unitarios.sql"
if %errorlevel% neq 0 (
    echo ERRO: Falha ao atualizar valores unitários
    pause
    exit /b 1
)

echo.
echo ========================================
echo Melhorias aplicadas com sucesso!
echo ========================================
echo.
echo O módulo de registrar vendas agora inclui:
echo - Quantidade em toneladas
echo - Valor unitário por tonelada
echo - Valor total do pedido
echo - Quantidade total vendida
echo.
pause 