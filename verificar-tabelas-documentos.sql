-- Script para verificar as tabelas de documentos
-- Execute este script no PostgreSQL para verificar se as tabelas existem e estão populadas

-- 1. Verificar se a tabela tipos_documento existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tipos_documento') 
        THEN '✅ Tabela tipos_documento existe'
        ELSE '❌ Tabela tipos_documento NÃO existe'
    END as status_tipos_documento;

-- 2. Verificar se a tabela documentos existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documentos') 
        THEN '✅ Tabela documentos existe'
        ELSE '❌ Tabela documentos NÃO existe'
    END as status_documentos;

-- 3. Verificar se a tabela clientes existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clientes') 
        THEN '✅ Tabela clientes existe'
        ELSE '❌ Tabela clientes NÃO existe'
    END as status_clientes;

-- 4. Contar registros na tabela tipos_documento
SELECT 
    'tipos_documento' as tabela,
    COUNT(*) as total_registros
FROM tipos_documento;

-- 5. Listar tipos de documento
SELECT 
    id,
    nome,
    requer_validade
FROM tipos_documento 
ORDER BY nome;

-- 6. Contar registros na tabela documentos
SELECT 
    'documentos' as tabela,
    COUNT(*) as total_registros
FROM documentos;

-- 7. Contar registros na tabela clientes
SELECT 
    'clientes' as tabela,
    COUNT(*) as total_registros
FROM clientes;

-- 8. Verificar estrutura da tabela documentos
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'documentos'
ORDER BY ordinal_position; 