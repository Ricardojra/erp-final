/**
 * main.js
 * Script principal para gerenciamento da aplicação Axel ERP
 */

// Configurações globais
const APP_CONFIG = {
  API_BASE_URL:
    window.env?.API_URL ||
    (location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:3000"
      : "https://api.axel-erp.com"),
  CACHE_TTL: 300000, // 5 minutos em ms
  REQUEST_TIMEOUT: 8000, // 8 segundos
};

// Mapeamento de páginas para seus scripts
const PAGE_SCRIPTS = {
  // Adicionada entrada para 'inicio' para evitar o aviso de script não configurado
  inicio: {
    id: "inicio-script",
    src: "./js/inicio.js", // <-- MUDANÇA AQUI: Defina o caminho do script
    init: "initCalculadoraAmbiental", // <-- MUDANÇA AQUI: Nome da função de inicialização em inicio.js
    cleanup: null, // Deixe como null ou defina uma função de limpeza se houver
  },
  "dashboard-notas": {
    id: "dashboard-notas-script",
    src: "./js/dashboard-notas.js",
    init: "initDashboardNotas",
    cleanup: "cleanupDashboardNotas",
  },

  "entrada-nfe": {
    id: "entrada-nfe-script",
    src: "./js/entrada-nfe.js",
    init: "initEntradaNFE",
    cleanup: "cleanupEntradaNFE",
  },
  "alterar-status": {
    id: "alterar-status-script",
    src: "./js/alterar-status.js",
    init: "initAlterarStatus",
    cleanup: "cleanupAlterarStatus",
  },
  "consulta-estoque": {
    id: "consulta-estoque-script",
    src: "./js/consulta-cliente-notas.js",
    init: "initConsultaNotasCliente",
    cleanup: "cleanupConsultaNotasCliente",
  },
  "cadastro-clientes": {
    id: "cadastro-cliente-xml-script", // ID do script, reflete o nome do arquivo JS
    src: "./js/cadastro-cliente-xml.js",
    init: "initCadastroClienteXML", // Assumindo que este script tem uma função de inicialização
    cleanup: "cleanupCadastroClienteXML", // Assumindo que este script tem uma função de limpeza
  },
  "alteracao-cadastro": {
    id: "alteracao-cadastro-script",
    src: "./js/alteracao-cadastro.js",
    init: "initAlteracaoCadastro", // Assumindo que este script tem uma função de inicialização
    cleanup: "cleanupAlteracaoCadastro", // Assumindo que este script tem uma função de limpeza
  },
  "lista-clientes": {
    id: "lista-clientes-script",
    src: "./js/lista-clientes.js",
    init: "initListaClientes", // Assumindo que este script tem uma função de inicialização
    cleanup: "cleanupListaClientes", // Assumindo que este script tem uma função de limpeza
  },
  "cliente-detalhes": {
    id: "cliente-detalhes-script",
    src: "./js/cliente-detalhes.js",
    init: null, // O script se auto-inicializa
    cleanup: null // Não necessita de limpeza específica
  },
  // ***** ENTRADA CRUCIAL PARA O MÓDULO DE GESTÃO DE DOCUMENTOS *****
  "gestao-documentacao": {
    id: "gestao-documentacao-script",
    src: "./js/gestao-documentacao.js",
    init: "initGestaoDocumentacao", // Assumindo que este script tem uma função de inicialização
    cleanup: "cleanupGestaoDocumentacao", // Assumindo que este script tem uma função de limpeza
  },
  "registrar-venda": {
    id: "registrar-venda-script",
    src: "./js/registrar-venda.js",
    init: "initRegistrarVenda",
    cleanup: "cleanupRegistrarVenda",
  },
  "historico-vendas": {
    id: "historico-vendas-script",
    src: "./js/historico-vendas.js",
    init: "initHistoricoVendas",
    cleanup: "cleanupHistoricoVendas",
  },
  "relatorio-vendas": {
    id: "relatorio-vendas-script",
    src: "./js/relatorio-vendas.js",
    init: "initRelatorioVendas",
    cleanup: "cleanupRelatorioVendas",
  },
  "envio-lotes": {
    id: "envio-lotes-script",
    src: "./js/envio-lotes.js",
    init: "initEnvioLotes",
    cleanup: "cleanupEnvioLotes",
  },
  "dashboard-material": {
    id: "dashboard-material-script",
    src: "./js/dashboard-material.js",
    css: "./css/dashboard-material.css",
    init: "initDashboardMaterial",
    cleanup: "cleanupDashboardMaterial",
  },
  "configuracoes": {
    id: "configuracoes-script",
    src: "./js/configuracoes.js",
    init: "initConfiguracoes",
    cleanup: "cleanupConfiguracoes",
  },
  "validar-lote-vendas": {
    id: "validar-lote-vendas-script",
    src: "./js/validar-lote-vendas.js",
    init: null,
    cleanup: null,
  },
};


// Cache para HTML parciais
const contentCache = new Map();

// Variável para armazenar a função de limpeza da página atualmente ativa
let activeCleanupFunction = null;

// Objeto principal com todas as funções utilitárias
const appUtils = {
  /**
   * Inicializa a sidebar com comportamentos de toggle
   */
  // Objeto principal com todas as funções utilitárias

  APP_CONFIG: APP_CONFIG, 

  /**
   * Inicializa a sidebar com comportamentos de toggle
   */
  
  initSidebar() {
    // Controle de submenus - usando o ID correto do seu HTML
    const submenuGestao = document.getElementById("submenu-gestao");

    if (submenuGestao) {
      submenuGestao.addEventListener("show.bs.collapse", () => {
        this.toggleChevronIcon(submenuGestao, "down", "up");
      });

      submenuGestao.addEventListener("hide.bs.collapse", () => {
        this.toggleChevronIcon(submenuGestao, "up", "down");
      });
    }
  },

  /**
   * Alterna ícone chevron entre up/down
   */
  toggleChevronIcon(element, from, to) {
    const toggle = document.querySelector(`[data-bs-target="#${element.id}"]`);
    if (toggle) {
      const icon =
        toggle.querySelector(`.bi-chevron-${from}`) ||
        toggle.querySelector(`.fa-chevron-${from}`);
      if (icon) {
        if (icon.classList.contains(`bi-chevron-${from}`)) {
          icon.classList.replace(`bi-chevron-${from}`, `bi-chevron-${to}`);
        } else {
          icon.classList.replace(`fa-chevron-${from}`, `fa-chevron-${to}`);
        }
      }
    }
  },

  /**
   * Carrega conteúdo dinamicamente
   */
  async loadContent(page) {
    const contentDiv = document.getElementById("content");
    if (!contentDiv) return;

    try {
      // Mostrar estado de carregamento
      this.showLoading(true);

      // Limpar estado da página anterior ANTES de carregar o novo HTML
      // Usando a variável global activeCleanupFunction
      if (
        activeCleanupFunction &&
        typeof activeCleanupFunction === "function"
      ) {
        console.log(
          `[main.js] Executando função de limpeza da página anterior.`
        );
        try {
          activeCleanupFunction();
        } catch (cleanupError) {
          console.error(`[main.js] Erro na função de limpeza:`, cleanupError);
        }
        activeCleanupFunction = null; // Limpa a referência após a execução
      }

      // Carregar HTML
      const html = await this.fetchPageContent(page);
      contentDiv.innerHTML = html;

      // Atualizar UI
      this.updatePageTitle(this.getPageTitle(page));
      this.setActiveNavItem(page);

      // Carregar scripts da página
      const scriptConfig = PAGE_SCRIPTS[page];
      if (scriptConfig && scriptConfig.src) {
        await this.loadPageScript(scriptConfig);
      } else if (scriptConfig) {
        console.log(
          `[main.js] Página '${page}' configurada, mas não requer script JS dedicado.`
        );
        
      } else {
        console.warn(
          `[main.js] Nenhum script configurado para a página: ${page}`
        );
      }

      // Após carregar o script da nova página, armazena sua função de limpeza, se existir
      if (
        scriptConfig &&
        scriptConfig.cleanup &&
        typeof window[scriptConfig.cleanup] === "function"
      ) {
        activeCleanupFunction = window[scriptConfig.cleanup];
      }
    } catch (error) {
      this.handleContentError(error);
    } finally {
      this.showLoading(false);
    }
  },

  /**
   * Carrega conteúdo da página com cache
   */
  async fetchPageContent(page) {
    // Verificar cache válido
    const cached = contentCache.get(page);
    const now = Date.now();

    if (cached && now - cached.timestamp < APP_CONFIG.CACHE_TTL) {
      return cached.html;
    }

    const response = await this.fetchWithTimeout(`./partials/${page}.html`);

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    contentCache.set(page, { html, timestamp: now });
    return html;
  },

  /**
   * Gerencia estado de carregamento
   */
  showLoading(show) {
    const contentDiv = document.getElementById("content");
    const loadingIndicator = document.getElementById("loading-indicator");

    if (loadingIndicator) {
      show
        ? loadingIndicator.classList.remove("d-none")
        : loadingIndicator.classList.add("d-none");
    }
    if (contentDiv) {
      show
        ? contentDiv.classList.add("d-none")
        : contentDiv.classList.remove("d-none");
    }
  },

  /**
   * Limpa os scripts da página atual
   * Esta função foi modificada para usar a variável activeCleanupFunction global
   * e agora é chamada no início de loadContent, garantindo que a limpeza ocorra antes do novo DOM ser carregado.
   * Mantida aqui apenas para referência e para a função clearContent.
   */
  cleanupCurrentPage() {
    // A lógica principal de limpeza foi movida para o início de loadContent
    // Esta função agora serve para garantir que, se for chamada de outro lugar (ex: clearContent),
    // a função de limpeza ativa seja executada.
    if (activeCleanupFunction && typeof activeCleanupFunction === "function") {
      console.log(
        `[main.js] Executando função de limpeza em cleanupCurrentPage.`
      );
      try {
        activeCleanupFunction();
      } catch (cleanupError) {
        console.error(
          `[main.js] Erro na função de limpeza em cleanupCurrentPage:`,
          cleanupError
        );
      }
      activeCleanupFunction = null; // Limpa a referência
    }
    // Remove o elemento <script> do DOM, se ele foi adicionado dinamicamente
    const currentPage = this.getPageFromHash();
    if (currentPage && PAGE_SCRIPTS[currentPage]) {
      const { id } = PAGE_SCRIPTS[currentPage];
      const scriptElement = document.getElementById(id);
      if (scriptElement) {
        scriptElement.remove();
        console.log(`[main.js] Script '${id}' removido do DOM.`);
      }
    }
  },

  /**
   * Tratamento de erros centralizado
   */
  handleContentError(error) {
    console.error("Erro ao carregar conteúdo:", error);
    const contentDiv = document.getElementById("content");

    if (contentDiv) {
      contentDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Erro ao carregar conteúdo</h4>
                    <p>${error.message}</p>
                    <hr>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.location.reload()">
                        Tentar novamente
                    </button>
                </div>
            `;
    }

    this.showNotification(
      "Erro",
      "Não foi possível carregar o conteúdo solicitado",
      "error"
    );
  },

  /**
   * Exibe notificação para o usuário
   */
  /**
   * Exibe notificação para o usuário com melhor design
   */
  showNotification(title, message, type = "info") {
    const container = this.createNotificationContainer();
    
    const alertClass = {
      success: "alert-success border-success",
      error: "alert-danger border-danger", 
      warning: "alert-warning border-warning",
      info: "alert-info border-info"
    }[type] || "alert-info border-info";

    const iconClass = {
      success: "fas fa-check-circle text-success",
      error: "fas fa-exclamation-triangle text-danger",
      warning: "fas fa-exclamation-circle text-warning", 
      info: "fas fa-info-circle text-info"
    }[type] || "fas fa-info-circle text-info";

    const notification = document.createElement("div");
    notification.className = `alert ${alertClass} alert-dismissible fade show notification-item shadow-sm`;
    notification.style.cssText = `
      border-left: 4px solid;
      margin-bottom: 0.5rem;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div class="d-flex align-items-start">
        <i class="${iconClass} me-3 mt-1" style="font-size: 1.2rem;"></i>
        <div class="flex-grow-1">
          <h6 class="alert-heading mb-1">${title}</h6>
          ${message ? `<p class="mb-0 small">${message}</p>` : ''}
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
      </div>
    `;

    container.appendChild(notification);

    // Auto-remove após 8 segundos para notificações de sucesso, 12 para outras
    const timeout = type === 'success' ? 8000 : 12000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, timeout);
  },

  createNotificationContainer() {
    const container = document.createElement("div");
    container.id = "notification-container";
    container.className = "position-fixed top-0 end-0 p-3";
    container.style.zIndex = "1050";
    document.body.appendChild(container);
    return container;
  },

  /**
   * Obtém o título formatado da página
   */
  getPageTitle(pageId) {
    const titleMap = {
      inicio: "Início", // Adicionado título para a página inicial
      "dashboard-notas": "Dashboard de Notas Fiscais no Sistema",
      "dashboard-material": "Dashboard de Materiais Processados no Sistema",
      "entrada-nfe": "Entrada de NFe no Sistema",
      "alterar-status": "Alterar Status das NF-e no Estoque",
      "consulta-estoque": "Consulta de Estoque por Cliente",
      "cadastro-clientes": "Cadastro de Clientes por XML",
      "alteracao-cadastro": "Alteração de Cadastro de Clientes",
      "exclusao-clientes": "Exclusão de Clientes",
      "lista-clientes": "Lista de Clientes",
      "gestao-documentacao": "Gestão de Documentos", // Título para a página de Gestão de Documentos
      "validar-lote-venda": "Validar Lote de Venda",
      "registrar-venda": "Registrar Venda de Notas Fiscais",
      "historico-vendas": "Histórico de Vendas",
      "relatorios-vendas": "Relatórios de Vendas",
      "contas-receber": "Contas a Receber",
      "contas-pagar": "Contas a Pagar",
      "fluxo-caixa": "Fluxo de Caixa",
      "relatorios-financeiros": "Relatórios Financeiros",
      "conciliacao-bancaria": "Conciliação Bancária",
    };
    return titleMap[pageId] || this.formatPageTitle(pageId);
  },

  formatPageTitle(pageId) {
    return pageId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  },

  /**
   * Extrai o nome da página do hash da URL
   */
  getPageFromHash() {
    const hash = window.location.hash;
    // Remove o '#/' do início para obter o nome da página limpo
    const pageName = hash?.startsWith("#/") ? hash.substring(2) : null;
    // Se houver parâmetros de query (ex: #/alteracao-cadastro?id=123), remove-os
    return pageName ? pageName.split("?")[0] : null;
  },

  /**
   * Define o item de menu ativo
   */
  setActiveNavItem(page) {
    document.querySelectorAll(".sidebar-menu li").forEach((item) => {
      item.classList.remove("active");
    });

    const activeLink = document.querySelector(
      `.sidebar-menu a[onclick*="loadContent('${page}')"]`
    );
    if (activeLink) {
      let currentElement = activeLink;
      while (
        currentElement &&
        !currentElement.classList.contains("sidebar-menu")
      ) {
        if (currentElement.tagName === "LI") {
          currentElement.classList.add("active");
        }
        currentElement = currentElement.parentElement;
      }
      // Abre o submenu pai se estiver fechado
      const parentCollapse = activeLink.closest(".collapse.submenu");
      if (parentCollapse && !parentCollapse.classList.contains("show")) {
        const bsCollapse = new bootstrap.Collapse(parentCollapse, {
          toggle: false,
        });
        bsCollapse.show();
      }
    }
  },

  /**
   * Fazer requisição com timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      APP_CONFIG.REQUEST_TIMEOUT
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  /**
   * Carrega script específico para a página
   */
  loadPageScript(scriptInfo) {
    return new Promise((resolve, reject) => {
      const { id, src, init } = scriptInfo;

      if (!src) {
        // Se não há um src definido, resolve imediatamente (para páginas sem JS dedicado)
        console.log(`[main.js] Página '${id}' não requer script JS.`);
        return resolve();
      }

      // Remove script anterior com o mesmo ID se existir, para garantir recarregamento limpo
      const existingScript = document.getElementById(id);
      if (existingScript) {
        existingScript.remove();
        console.log(`[main.js] Removido script existente: ${id}`);
      }

      const script = document.createElement("script");
      script.id = id;
      script.src = `${src}?v=${Date.now()}`; // Adiciona um timestamp para evitar cache do navegador
      script.async = true;
      script.type = "module"; // Garante que scripts sejam tratados como módulos, se aplicável

      script.onload = () => {
        console.log(`[main.js] Script ${src} carregado com sucesso.`);
        // Esta parte é crucial: chama a função 'init' se definida no PAGE_SCRIPTS e existir no window
        if (init && typeof window[init] === "function") {
          try {
            window[init]();
            resolve();
          } catch (error) {
            reject(
              new Error(
                `[main.js] Falha ao inicializar ${init}: ${error.message}`
              )
            );
          }
        } else {
          resolve(); // Resolve mesmo sem uma função init global explícita
        }
      };

      script.onerror = () => {
        console.error(`[main.js] Falha ao carregar script: ${src}`);
        reject(new Error(`[main.js] Falha ao carregar script: ${src}`));
      };

      document.body.appendChild(script);
    });
  },

  /**
   * Atualiza o título da página
   */
  updatePageTitle(title) {
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) {
      pageTitle.textContent = title;
    }
    document.title = `Axel ERP - ${title}`;
  },

  /**
   * Limpa o conteúdo principal
   */
  clearContent() {
    const contentDiv = document.getElementById("content");
    if (contentDiv) {
      contentDiv.innerHTML = `
                    <div class="welcome-screen">
                        <h1>Bem-vindo ao Axel ERP</h1>
                        <p>Selecione uma opção no menu lateral para começar.</p>
                    </div>
                `;
      this.updatePageTitle("Início");
    }
    this.cleanupCurrentPage(); // Garante que a limpeza da página atual seja feita ao limpar o conteúdo
  },

  /**
   * Formata uma data (string ou objeto Date) para o formato dd/mm/yyyy.
   * @param {string | Date} dateString - A data a ser formatada.
   * @returns {string} A data formatada ou uma string de erro se a entrada for inválida.
   */
  formatDate(dateString) {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`[formatDate] Data inválida recebida: ${dateString}`);
      return 'Data inválida';
    }
    // Corrige o problema de fuso horário que pode fazer a data "voltar" um dia
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);

    const day = String(correctedDate.getDate()).padStart(2, '0');
    const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
    const year = correctedDate.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Inicializa atalhos de teclado para melhorar produtividade
   */
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K - Busca rápida
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.showQuickSearch();
      }
      
      // Ctrl/Cmd + N - Nova nota fiscal
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.loadContent('entrada-nfe');
      }
      
      // Ctrl/Cmd + D - Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        this.loadContent('dashboard-material');
      }
      
      // Ctrl/Cmd + C - Clientes
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        this.loadContent('lista-clientes');
      }
      
      // F5 - Atualizar página atual
      if (e.key === 'F5') {
        e.preventDefault();
        this.refreshCurrentPage();
      }
    });
  },

  /**
   * Mostra busca rápida
   */
  showQuickSearch() {
    const searchModal = document.createElement('div');
    searchModal.className = 'modal fade';
    searchModal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-search me-2"></i>Busca Rápida
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="input-group mb-3">
              <span class="input-group-text">
                <i class="fas fa-search"></i>
              </span>
              <input type="text" class="form-control" id="quickSearchInput" 
                     placeholder="Digite para buscar notas fiscais, clientes, materiais...">
            </div>
            <div id="quickSearchResults" class="list-group">
              <!-- Resultados aparecerão aqui -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(searchModal);
    const modal = new bootstrap.Modal(searchModal);
    modal.show();
    
    // Focar no input
    setTimeout(() => {
      document.getElementById('quickSearchInput').focus();
    }, 500);
    
    // Limpar modal quando fechado
    searchModal.addEventListener('hidden.bs.modal', () => {
      searchModal.remove();
    });
  },

  /**
   * Atualiza a página atual
   */
  refreshCurrentPage() {
    const currentPage = this.getCurrentPage();
    if (currentPage && currentPage !== 'home') {
      this.loadContent(currentPage);
      this.showNotification('Página Atualizada', 'Os dados foram atualizados com sucesso.', 'success');
    }
  },

  /**
   * Obtém a página atual
   */
  getCurrentPage() {
    const activeLink = document.querySelector('.sidebar-menu li.active a');
    if (activeLink) {
      const onclick = activeLink.getAttribute('onclick');
      if (onclick) {
        const match = onclick.match(/'([^']+)'/);
        return match ? match[1] : null;
      }
    }
    return null;
  },
};

// Inicialização da aplicação
document.addEventListener("DOMContentLoaded", () => {
  // Exporta funções para uso global
  window.appUtils = appUtils;
  window.loadContent = (page) => appUtils.loadContent(page);
  window.clearContent = () => appUtils.clearContent();

  // Inicializa componentes
  appUtils.initSidebar();

  // Configura eventos do header da sidebar
  const sidebarHeader = document.querySelector(".sidebar-header");
  if (sidebarHeader) {
    sidebarHeader.addEventListener("click", (e) => {
      // Verifica se o clique foi no header ou em uma imagem dentro dele
      if (e.target === sidebarHeader || e.target.tagName === "IMG") {
        // Leva para a tela inicial sem recarregar a página
        loadContent('inicio');
      }
    });
  }

  // Carrega a página inicial
  const initialPage = appUtils.getPageFromHash() || "inicio";
  appUtils.loadContent(initialPage).catch((error) => {
    console.error("Falha ao carregar conteúdo inicial:", error);
    appUtils.showNotification(
      "Erro",
      "Falha ao carregar a página inicial",
      "error"
    );
  });

  // Adiciona listener para mudanças no hash da URL
  window.onhashchange = () => {
    const page = appUtils.getPageFromHash();
    if (page) {
      appUtils.loadContent(page).catch((error) => {
        console.error("[main.js] Falha ao carregar conteúdo via hash:", error);
        appUtils.showNotification(
          "Erro",
          "Falha ao carregar a página solicitada",
          "error"
        );
      });
    } else {
      // Se o hash for limpo ou inválido, volta para a tela inicial
      appUtils.clearContent();
    }
  };
});
