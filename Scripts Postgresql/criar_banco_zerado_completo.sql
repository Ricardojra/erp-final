-- Script SQL para criação da estrutura do banco de dados gestao_estoque (zerado)
-- Baseado no backup fornecido: gestao_estoque_plain.sql

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- Tabela: cfop_permitidos
CREATE TABLE IF NOT EXISTS public.cfop_permitidos (
    id integer NOT NULL PRIMARY KEY,
    cfop character varying(10) NOT NULL
);
ALTER TABLE public.cfop_permitidos OWNER TO postgres;
CREATE SEQUENCE IF NOT EXISTS public.cfop_permitidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.cfop_permitidos_id_seq OWNER TO postgres;
ALTER SEQUENCE public.cfop_permitidos_id_seq OWNED BY public.cfop_permitidos.id;
ALTER TABLE ONLY public.cfop_permitidos ALTER COLUMN id SET DEFAULT nextval('public.cfop_permitidos_id_seq'::regclass);

-- Tabela: classificacao_ncm
CREATE TABLE IF NOT EXISTS public.classificacao_ncm (
    id integer NOT NULL PRIMARY KEY,
    ncm character varying(10) NOT NULL,
    material character varying(50) NOT NULL,
    CONSTRAINT classificacao_ncm_material_check CHECK (((material)::text = ANY (ARRAY[('Papel'::character varying)::text, ('Papelão'::character varying)::text, ('Vidro'::character varying)::text, ('Metal'::character varying)::text, ('Plástico'::character varying)::text])))
);
ALTER TABLE public.classificacao_ncm OWNER TO postgres;
CREATE SEQUENCE IF NOT EXISTS public.classificacao_ncm_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.classificacao_ncm_id_seq OWNER TO postgres;
ALTER SEQUENCE public.classificacao_ncm_id_seq OWNED BY public.classificacao_ncm.id;
ALTER TABLE ONLY public.classificacao_ncm ALTER COLUMN id SET DEFAULT nextval('public.classificacao_ncm_id_seq'::regclass);

-- Tabela: itens_notas_fiscais
CREATE TABLE IF NOT EXISTS public.itens_notas_fiscais (
    id integer NOT NULL PRIMARY KEY,
    nota_fiscal_id integer, -- Sugestão: Adicionar FOREIGN KEY (nota_fiscal_id) REFERENCES public.notas_fiscais(id)
    ncm character varying(10) NOT NULL,
    descricao character varying(255) NOT NULL,
    quantidade numeric(10,2) NOT NULL,
    unidade character varying(10) NOT NULL,
    material character varying(50) NOT NULL
);
ALTER TABLE public.itens_notas_fiscais OWNER TO postgres;
CREATE SEQUENCE IF NOT EXISTS public.itens_notas_fiscais_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.itens_notas_fiscais_id_seq OWNER TO postgres;
ALTER SEQUENCE public.itens_notas_fiscais_id_seq OWNED BY public.itens_notas_fiscais.id;
ALTER TABLE ONLY public.itens_notas_fiscais ALTER COLUMN id SET DEFAULT nextval('public.itens_notas_fiscais_id_seq'::regclass);

-- Tabela: log_importacao
CREATE TABLE IF NOT EXISTS public.log_importacao (
    id integer NOT NULL PRIMARY KEY,
    numero_nota character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    mensagem text NOT NULL,
    data_importacao timestamp without time zone DEFAULT now()
);
ALTER TABLE public.log_importacao OWNER TO postgres;
CREATE SEQUENCE IF NOT EXISTS public.log_importacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.log_importacao_id_seq OWNER TO postgres;
ALTER SEQUENCE public.log_importacao_id_seq OWNED BY public.log_importacao.id;
ALTER TABLE ONLY public.log_importacao ALTER COLUMN id SET DEFAULT nextval('public.log_importacao_id_seq'::regclass);

-- Tabela: notas_fiscais
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
    id integer NOT NULL PRIMARY KEY,
    chave_nfe character varying(44) NOT NULL UNIQUE,
    numero_nota character varying(20) NOT NULL,
    data_emissao date NOT NULL,
    emitente_cnpj character varying(14) NOT NULL,
    emitente_nome character varying(255) NOT NULL,
    emitente_uf character varying(2) NOT NULL,
    destinatario_cnpj character varying(14) NOT NULL,
    destinatario_nome character varying(255) NOT NULL,
    destinatario_uf character varying(2) NOT NULL,
    status character varying(50) NOT NULL CHECK (status IN ('disponivel', 'enviada', 'vendida', 'reprovada')),
    unidade_gestora character varying(50) NOT NULL,
    data_importacao date,
    usuario_responsavel VARCHAR(100), -- Adicionado conforme schema_db.md anterior
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Adicionado conforme schema_db.md anterior e boas práticas
);
ALTER TABLE public.notas_fiscais OWNER TO postgres;
COMMENT ON COLUMN public.notas_fiscais.unidade_gestora IS 'Unidade Gestora';
CREATE SEQUENCE IF NOT EXISTS public.notas_fiscais_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.notas_fiscais_id_seq OWNER TO postgres;
ALTER SEQUENCE public.notas_fiscais_id_seq OWNED BY public.notas_fiscais.id;
ALTER TABLE ONLY public.notas_fiscais ALTER COLUMN id SET DEFAULT nextval('public.notas_fiscais_id_seq'::regclass);

-- Comentários adicionais da tabela notas_fiscais (baseado no schema_db.md anterior)
COMMENT ON TABLE public.notas_fiscais IS 'Tabela para armazenar informações das notas fiscais eletrônicas.';
COMMENT ON COLUMN public.notas_fiscais.id IS 'Identificador único da nota fiscal (auto-incrementável).';
COMMENT ON COLUMN public.notas_fiscais.chave_nfe IS 'Chave de acesso da NF-e (44 dígitos), única e obrigatória.';
COMMENT ON COLUMN public.notas_fiscais.numero_nota IS 'Número da nota fiscal.';
COMMENT ON COLUMN public.notas_fiscais.data_emissao IS 'Data de emissão da nota fiscal.';
COMMENT ON COLUMN public.notas_fiscais.emitente_cnpj IS 'CNPJ do emitente da nota fiscal.';
COMMENT ON COLUMN public.notas_fiscais.emitente_nome IS 'Nome ou Razão Social do emitente.';
COMMENT ON COLUMN public.notas_fiscais.emitente_uf IS 'UF do emitente.';
COMMENT ON COLUMN public.notas_fiscais.destinatario_cnpj IS 'CNPJ do destinatário da nota fiscal.';
COMMENT ON COLUMN public.notas_fiscais.destinatario_nome IS 'Nome ou Razão Social do destinatário.';
COMMENT ON COLUMN public.notas_fiscais.destinatario_uf IS 'UF do destinatário.';
COMMENT ON COLUMN public.notas_fiscais.status IS 'Status atual da nota fiscal no sistema (disponivel, enviada, vendida, reprovada).';
COMMENT ON COLUMN public.notas_fiscais.data_importacao IS 'Data em que a nota foi importada para o sistema.';
COMMENT ON COLUMN public.notas_fiscais.usuario_responsavel IS 'Usuário responsável pelo registro ou última alteração da nota no sistema.';
COMMENT ON COLUMN public.notas_fiscais.data_registro IS 'Data e hora em que a nota foi registrada ou teve sua última atualização no sistema.';


-- Adicionar chaves primárias e estrangeiras que podem não estar na definição inline (pg_dump geralmente as coloca no final)
-- No entanto, para este script de criação zerado, adicionei PRIMARY KEY diretamente nas colunas ID.
-- Exemplo de como adicionar uma FOREIGN KEY se necessário:
-- ALTER TABLE ONLY public.itens_notas_fiscais ADD CONSTRAINT fk_itens_notas_fiscais_nota_fiscal_id FOREIGN KEY (nota_fiscal_id) REFERENCES public.notas_fiscais(id);


