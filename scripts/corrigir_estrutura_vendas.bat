@echo off
echo ========================================
echo Corrigindo estrutura das tabelas vendas
echo ========================================
echo.

echo Executando script SQL para corrigir estrutura...
dotenv -e ./backend/.env -- psql -U postgres -d gestao_estoque -f "Scripts Postgresql/corrigir_estrutura_vendas.sql"

echo.
echo ========================================
echo Correcao concluida!
echo ========================================
pause 