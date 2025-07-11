@echo off
echo ========================================
echo Testando funcionalidade de detalhes de vendas
echo ========================================
echo.

echo 1. Verificando se o servidor está rodando...
curl -s http://localhost:3000/api/vendas > nul
if %errorlevel% neq 0 (
    echo ERRO: Servidor não está rodando!
    echo Execute: npm start
    pause
    exit /b 1
)
echo ✓ Servidor está rodando

echo.
echo 2. Testando API de detalhes de vendas...
curl -s http://localhost:3000/api/vendas/1
if %errorlevel% neq 0 (
    echo ERRO: API não está respondendo!
) else (
    echo ✓ API está respondendo
)

echo.
echo 3. Verificando estrutura do banco...
echo Executando consulta de teste...
dotenv -e ./backend/.env -- psql -U postgres -d gestao_estoque -c "SELECT COUNT(*) as total_vendas FROM vendas;"

echo.
echo ========================================
echo Teste concluído!
echo ========================================
echo.
echo Para testar no navegador:
echo 1. Acesse: http://localhost:3000
echo 2. Vá para: Gestão de Vendas > Histórico de Vendas
echo 3. Clique em "Detalhes" em qualquer venda
echo.
pause 