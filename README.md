# Gestão Inteligente do Crédito de Reciclagem

Sistema para gestão de créditos de reciclagem com interface moderna e funcionalidades dinâmicas.

## 🚀 Tecnologias
- Frontend: HTML5, Bootstrap 5, JavaScript
- Backend: Node.js, Express
- Banco de Dados: PostgreSQL
- Ferramentas: Nodemon, dotenv

## 📁 Estrutura do Projeto

projeto-axel/
├── frontend/
│ ├── assets/
│ │ └── images/ # Imagens estáticas (logo, ícones)
│ ├── partials/ # Templates HTML parcials
│ │ ├── entrada-nfe.html
│ │ └── envio-numero.html
│ ├── js/
│ │ └── main.js # Lógica principal da aplicação
│ └── main.html # Página principal
├── backend/
│ ├── config/
│ │ └── dbConfig.js
│ ├── routes/
│ │ └── importarNotasFiscaisRoute.js
│ ├── server.js # Servidor Node.js
│ └── .env # Variáveis de ambiente
├── package.json
└── README.md


## 📋 Descrição das Pastas

### `frontend/`
- **assets/images**: Armazena todas as imagens estáticas (logo.png, etc)
- **partials**: Contém os fragmentos HTML carregados dinamicamente
- **js**: Scripts JavaScript da aplicação
- **main.html**: Página principal que serve como container da SPA

### `backend/`
- **server.js**: Configuração do servidor Express e rotas
- **.env**: Configurações de ambiente (banco de dados, porta)

## ⚙️ Pré-requisitos
- Node.js v16+
- PostgreSQL
- NPM


## 📋 Descrição das Pastas

### `frontend/`
- **assets/images**: Armazena todas as imagens estáticas (logo.png, etc)
- **partials**: Contém os fragmentos HTML carregados dinamicamente
- **js**: Scripts JavaScript da aplicação
- **main.html**: Página principal que serve como container da SPA

### `backend/`
- **server.js**: Configuração do servidor Express e rotas
- **.env**: Configurações de ambiente (banco de dados, porta)

## ⚙️ Pré-requisitos
- Node.js v16+
- PostgreSQL
- NPM

## ⚙️ Instale as dependências
- npm install

## ⚙️ Configure o banco de dados
- Crie um banco PostgreSQL chamado gestao_estoque
- Atualize o .env com suas credenciais

## 🌐 Inicie o servidor
- npm start

## 🌐 Acesso
- [npm start](http://localhost:3000)

## 🛠 Funcionalidades Principais
- SPA (Single Page Application)
- Navegação sem recarregamento de página
- Carregamento dinâmico de conteúdo
- Menu Interativo
- Submenu expansível com animação
- Ícones contextualizados
- Layout Responsivo
- Design adaptável usando Bootstrap
- Componentes modernos e acessíveis


ATUALIZADO EM 10/06/2025

Com certeza! Vamos atualizar o README.md para refletir o estágio atual do projeto, destacando as novas funcionalidades e o que ainda precisa ser implementado para a conclusão do sistema.

Plataforma de Gestão Axel
Visão Geral do Projeto
A Plataforma de Gestão Axel é uma aplicação web Fullstack dedicada a otimizar a gestão de materiais reciclados, notas fiscais e inventário, com um foco especial na transparência e no impacto ambiental positivo. O sistema permite um controle eficiente desde a importação de notas fiscais até o registro de vendas, culminando na apresentação do benefício ecológico gerado pela reciclagem.

Status Atual do Projeto
A estrutura principal para a gestão de notas fiscais e vendas está implementada. A página inicial (inicio.html) foi redesenhada para apresentar uma Calculadora Ambiental de Vendas, que será o principal destaque de impacto ecológico da plataforma.

Funcionalidades Principais
Importação de Notas Fiscais (XML): Permite o upload de arquivos XML de notas fiscais eletrônicas (NFe), realizando o parseamento e a inserção automática de dados essenciais (emitente, destinatário, itens, quantidades) no banco de dados.
Gestão de Inventário e Status: Controle granular sobre os materiais em estoque. Cada nota fiscal e seus itens podem ter seu status atualizado (ex: pendente, disponivel, ofertada, vendida, enviada, reprovada), refletindo o ciclo de vida do material.
Registro Detalhado de Vendas: Módulo completo para registrar transações de venda de materiais, associando-as às notas fiscais de origem e automaticamente atualizando o status das notas fiscais envolvidas para vendida. Inclui informações do comprador, valor total, número do pedido e observações.
Consultas Flexíveis:
Busca de notas fiscais por nome de cliente (emitente/destinatário) com filtro opcional por ano.
Busca de notas fiscais por uma lista de números de nota específicos.
Listagem de notas fiscais com status disponivel ou ofertada para facilitar o processo de venda.
Dashboard de Impacto (Página Inicial): A página inicio.html foi remodelada para focar na Calculadora Ambiental de Vendas, que apresentará os seguintes Indicadores Chave de Desempenho (KPIs):
CO2 Evitado: Redução das emissões de gases de efeito estufa.
Água Poupada: Volume de água economizado no processo de reciclagem.
Energia Economizada: Economia de energia ao reutilizar materiais.
Resíduos Desviados de Aterros: Quantidade de material que foi reciclado e não enviado para aterros sanitários.
Recursos Naturais Preservados: Matéria-prima virgem que não precisou ser extraída.
Outros Indicadores (Backend): O backend já oferece endpoints para contagem de notas por status e agregação de materiais por status, que podem ser usados para futuros relatórios ou dashboards.
Tecnologias Utilizadas
O projeto é construído com uma arquitetura Fullstack, utilizando as seguintes tecnologias:

Backend:
Node.js: Ambiente de execução JavaScript.
Express.js: Framework web para construção da API RESTful.
PostgreSQL: Banco de dados relacional para armazenamento de dados das notas fiscais, itens e vendas.
pg: Driver Node.js para PostgreSQL.
xml2js: Biblioteca para parsear dados XML.
Frontend:
HTML5: Estrutura da aplicação web.
CSS3: Estilização.
JavaScript (Vanilla JS): Lógica interativa do lado do cliente.
Bootstrap 5: Framework CSS para componentes e responsividade da interface.
Font Awesome: Biblioteca de ícones.
Pré-requisitos
Antes de rodar o projeto, certifique-se de ter instalado:

Node.js (versão LTS recomendada)
npm (gerenciador de pacotes do Node.js, vem com o Node.js)
PostgreSQL (servidor de banco de dados)
Configuração e Instalação
Siga os passos abaixo para configurar e rodar a aplicação em seu ambiente local:

1. Clonar o Repositório
Bash

git clone <URL_DO_SEU_REPOSITORIO>
cd plataforma-axel
2. Configurar o Banco de Dados
Crie um banco de dados PostgreSQL para o projeto (ex: axel_db).

Execute as seguintes queries SQL para criar as tabelas necessárias:

SQL

-- Tabela de Notas Fiscais
CREATE TABLE IF NOT EXISTS notas_fiscais (
    id SERIAL PRIMARY KEY,
    chave_nfe VARCHAR(44) UNIQUE NOT NULL,
    numero_nota VARCHAR(20) NOT NULL,
    data_emissao DATE NOT NULL,
    emitente_cnpj VARCHAR(14) NOT NULL,
    emitente_nome VARCHAR(255) NOT NULL,
    emitente_uf VARCHAR(2),
    destinatario_cnpj VARCHAR(14) NOT NULL,
    destinatario_nome VARCHAR(255) NOT NULL,
    destinatario_uf VARCHAR(2),
    xml_content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, disponivel, ofertada, vendida, enviada, reprovada
    unidade_gestora VARCHAR(255) -- Adicionada unidade gestora
);

-- Tabela de Itens das Notas Fiscais
CREATE TABLE IF NOT EXISTS itens_notas_fiscais (
    id SERIAL PRIMARY KEY,
    nota_fiscal_id INT NOT NULL,
    ncm VARCHAR(8),
    descricao VARCHAR(255) NOT NULL,
    quantidade NUMERIC(15, 4) NOT NULL,
    unidade VARCHAR(10) NOT NULL,
    material VARCHAR(100), -- Ex: Plastico, Papel, Metal, Vidro
    FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE
);

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS vendas (
    id SERIAL PRIMARY KEY,
    data_venda DATE NOT NULL,
    cliente_comprador_nome VARCHAR(255) NOT NULL,
    cliente_comprador_documento VARCHAR(20), -- CNPJ/CPF
    valor_total_venda NUMERIC(15, 2) NOT NULL,
    numero_pedido_compra VARCHAR(100),
    unidade_gestora_venda VARCHAR(255) NOT NULL,
    observacoes TEXT,
    usuario_registro VARCHAR(100), -- Usuário que registrou a venda
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens de Venda (detalhes dos materiais vendidos)
CREATE TABLE IF NOT EXISTS itens_de_venda (
    id SERIAL PRIMARY KEY,
    venda_id INT NOT NULL,
    nota_fiscal_id INT NOT NULL, -- FK para a nota fiscal de origem
    item_nota_fiscal_id INT NOT NULL, -- FK para o item da nota fiscal original
    numero_nota_origem VARCHAR(20) NOT NULL,
    ncm VARCHAR(8),
    descricao VARCHAR(255) NOT NULL,
    quantidade NUMERIC(15, 4) NOT NULL,
    unidade VARCHAR(10) NOT NULL,
    material VARCHAR(100), -- Tipo de material vendido
    valor_unitario_item_venda NUMERIC(15, 2),
    valor_total_item_venda NUMERIC(15, 2),
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE,
    FOREIGN KEY (item_nota_fiscal_id) REFERENCES itens_notas_fiscais(id) ON DELETE CASCADE
);
3. Configurar Variáveis de Ambiente
Crie um arquivo .env na pasta backend (na mesma pasta de package.json do backend) com as seguintes informações para a conexão com o banco de dados e a porta do servidor:

DB_USER=seu_usuario_postgres
DB_HOST=localhost
DB_DATABASE=axel_db
DB_PASSWORD=sua_senha_postgres
DB_PORT=5432
PORT=3000
4. Instalar Dependências
Navegue até a pasta backend e instale as dependências:

Bash

cd backend
npm install
5. Iniciar a Aplicação
A partir da pasta backend:

Bash

npm start
O servidor backend estará rodando em http://localhost:3000 (ou na porta definida no seu .env). O frontend será servido a partir da pasta public ou de onde você configurou o Express para servir arquivos estáticos.

Próximos Passos & O que falta para Concluir
Para que a Plataforma de Gestão Axel esteja totalmente operacional e a Calculadora Ambiental funcione com dados reais, as seguintes implementações são necessárias:

Backend - Endpoint da Calculadora Ambiental:
Criar um novo endpoint na API (backend/controllers/notasFiscaisController.js ou um novo controlador de impactoAmbientalController.js) que:
Consulte todos os materiais vendidos (e suas quantidades) na tabela itens_de_venda.
Agrupe e some as quantidades por material (ex: total de Plástico, total de Papel, etc.).
Implemente os Fatores de Conversão Ambiental: Adicione uma lógica para aplicar fatores de conversão (ex: X kg de CO2 evitado por kg de PET, Y litros de água poupada por kg de alumínio, etc.). Esses fatores podem ser definidos como constantes no código ou, idealmente, armazenados em uma tabela separada no banco de dados para maior flexibilidade.
Retorne os totais calculados para cada KPI (CO2 Evitado, Água Poupada, Energia Economizada, Resíduos Desviados, Recursos Naturais Preservados).
Frontend (public/js/inicio.js):
Desenvolver a lógica JavaScript que será executada na página inicio.html.
Fazer uma requisição (fetch) ao novo endpoint do backend para obter os dados calculados da calculadora ambiental.
Preencher os elementos HTML correspondentes (#impacto-co2, #impacto-agua, #impacto-energia, #residuos-desviados, #recursos-preservados) com os valores retornados e formatá-los adequadamente (ex: "kg", "Litros", "kWh").
Implementar a funcionalidade do botão "Atualizar Impacto" (#btnAtualizarImpacto) para que ele refaça a requisição e atualize os valores exibidos.
Adicionar lógica para exibir mensagens de feedback (#feedback-calculadora) sobre o carregamento ou erros.
Frontend - Vinculação de inicio.js:
Certificar-se de que o arquivo inicio.js esteja corretamente vinculado na inicio.html (geralmente com <script src="js/inicio.js"></script>).
Contribuição
Fique à vontade para contribuir com o projeto! Siga os seguintes passos:

Faça um fork do repositório.
Crie uma nova branch (git checkout -b feature/sua-feature).
Faça suas alterações e commit (git commit -m 'feat: Adiciona nova funcionalidade').
Envie para a branch remota (git push origin feature/sua-feature).
Abra um Pull Request.
Licença
Este projeto está licenciado sob a licença MIT. Consulte o arquivo LICENSE para mais detalhes.

