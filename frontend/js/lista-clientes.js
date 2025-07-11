// Este log deve aparecer no console se o arquivo for carregado
console.log("[Frontend] lista-clientes.js: Script file loaded.");

// Verifica se jQuery está definido antes de prosseguir
if (typeof jQuery === "undefined") {
  console.error(
    "[Frontend] jQuery não está carregado. Certifique-se de que o jQuery CDN está no main.html antes deste script."
  );
  // Exibe uma mensagem de erro na interface se possível
  const listFeedbackMessage = $("#list-feedback-message");
  if (listFeedbackMessage.length) {
    listFeedbackMessage.html(`
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                Erro: jQuery não carregado. A lista de clientes não pode ser exibida.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
  }
} else {
  // Usa uma função auto-executável em vez de $(document).ready()
  (function () {
    console.log(
      "[Frontend] jQuery está carregado. Iniciando script lista-clientes.js."
    );

    // Acessa as configurações globais e funções utilitárias definidas em main.js
    const APP_CONFIG = window.appUtils?.APP_CONFIG || { API_BASE_URL: "http://localhost:3000" };
    const showNotification = window.appUtils?.showNotification || console.log;
    const toggleMainLoadingOverlay = window.appUtils?.showLoading || function() {};

    // Elementos da interface
    const clientsTableBody = $("#clients-table-body");
    console.log("[Frontend] clientsTableBody element:", clientsTableBody);
    const searchInput = $("#search-input");
    const addNewClientBtn = $("#add-new-client-btn");
    const loadingOverlay = $("#loading-overlay");
    const listFeedbackMessage = $("#list-feedback-message");
    
    // Elementos do modal de detalhes do cliente
    const clientDetailModalElement = document.getElementById("client-detail-modal");
    const clientDetailModal = clientDetailModalElement ? new bootstrap.Modal(clientDetailModalElement) : null;
    const detailCnpj = $("#detail-cnpj");
    const detailRazaoSocial = $("#detail-razao-social");
    const detailNomeFantasia = $("#detail-nome-fantasia");
    const detailNomeContato = $("#detail-nome-contato");
    const detailEndereco = $("#detail-endereco");
    const detailCidadeUf = $("#detail-cidade-uf");
    const detailCep = $("#detail-cep");
    const detailEmailContato = $("#detail-email-contato");
    const detailTelefoneContato = $("#detail-telefone-contato");
    const detailWhatsappNumero = $("#detail-whatsapp-numero");
    const detailAtivo = $("#detail-ativo");
    const detailDataCadastro = $("#detail-data-cadastro");
    const detailMateriaisVendidos = $("#detail-materiais-vendidos");
    const editClientModalBtn = $("#edit-client-modal-btn");
    
    // URL base da API do backend
    const API_BASE_URL = "http://localhost:3000"; // Ajuste para a URL do seu backend

    let allClients = []; // Armazena todos os clientes para filtragem local

    // --- Funções Auxiliares ---

    // Exibe mensagens de feedback (simplificado, já que o global está disponível)
    function showFeedback(message, type = "info", target = listFeedbackMessage) {
      target.html(`<div class="alert alert-${type}">${message}</div>`);
    }

    // Alterna a visibilidade do overlay de carregamento
    function toggleLoading(show, targetOverlay = loadingOverlay) {
      targetOverlay.toggleClass("active", show);
    }

    // Formata CNPJ para exibição
    function formatCnpj(cnpj) {
      return cnpj
        ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
        : "N/A";
    }

    // Formata CEP para exibição
    function formatCep(cep) {
      return cep ? cep.replace(/^(\d{5})(\d{3})$/, "$1-$2") : "N/A";
    }

    // Formata telefone para exibição
    function formatPhone(phone) {
      if (!phone) return "N/A";
      const cleaned = String(phone).replace(/\D/g, "");
      if (cleaned.length === 11) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(
          2,
          7
        )}-${cleaned.substring(7, 11)}`;
      } else if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(
          2,
          6
        )}-${cleaned.substring(6, 10)}`;
      }
      return phone;
    }

    // Renderiza a tabela de clientes
    function renderClientsTable(clientsToRender) {
      console.log(
        "[Frontend] renderClientsTable: Iniciando renderização da tabela."
      );
      clientsTableBody.empty();

      if (!clientsToRender || clientsToRender.length === 0) {
        console.log(
          "[Frontend] renderClientsTable: Nenhuns clientes para renderizar ou formato inválido."
        );
        clientsTableBody.append('<tr><td colspan="6" class="text-center">Nenhum cliente encontrado.</td></tr>');
        return;
      }

      console.log(
        `[Frontend] renderClientsTable: Tentando renderizar ${clientsToRender.length} clientes.`
      );
      const rowsHtml = clientsToRender.map(client => `
        <tr data-id="${client.id}" class="client-row" style="cursor:pointer;">
          <td>${formatCnpj(client.cnpj)}</td>
          <td>${client.nome_fantasia || "N/A"}</td>
          <td>${client.materiais_vendidos || "Nenhum"}</td>
          <td>${client.cidade || "N/A"}/${client.uf || "N/A"}</td>
          <td>${client.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-danger">Inativo</span>'}</td>
          <td class="text-center action-buttons">
            <button class="btn btn-sm btn-primary edit-client-btn" data-id="${client.id}" title="Editar Cliente">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-client-btn" data-id="${client.id}" title="Inativar/Excluir Cliente">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
      
      clientsTableBody.append(rowsHtml);
      console.log(
        "[Frontend] renderClientsTable: Linhas da tabela adicionadas."
      );

      // Remove os event listeners antigos para evitar duplicação
      $(".client-row").off("click");
      $(".edit-client-btn").off("click");
      $(".delete-client-btn").off("click");
      
      // Anexa os novos event listeners
      $(".client-row").on("click", handleClientRowClick);
      $(".edit-client-btn").on("click", handleEditClientClick);
      $(".delete-client-btn").on("click", handleDeleteClientClick);
      
      // Teste: adiciona um log para verificar se os botões existem
      const editButtons = $(".edit-client-btn");
      console.log(`[Frontend] renderClientsTable: ${editButtons.length} botões de edição encontrados`);
      
      // Teste: adiciona um event listener de teste
      editButtons.each(function(index) {
        console.log(`[Frontend] Botão ${index}:`, this);
        console.log(`[Frontend] Data ID do botão ${index}:`, $(this).data("id"));
      });
      
      console.log(
        "[Frontend] renderClientsTable: Event listeners re-anexados."
      );
    }

    // --- Lógica de Busca e Carregamento ---

    async function fetchClients() {
      toggleMainLoadingOverlay(true);
      listFeedbackMessage.empty();

      try {
        console.log(
          `[Frontend] Tentando buscar clientes de: ${APP_CONFIG.API_BASE_URL}/api/clientes`
        );
        const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/clientes`);

        console.log(
          `[Frontend] Resposta da API para clientes: Status ${response.status}, OK: ${response.ok}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Falha ao carregar clientes.");
        }

        const data = await response.json();
        console.log("[Frontend] Dados de clientes recebidos:", data);

        if (data.success && Array.isArray(data.clients)) {
          allClients = data.clients;
          renderClientsTable(allClients);
          showFeedback(`Total de clientes: ${allClients.length}`, "info");
        } else {
          showFeedback(
            data.message || "Formato de dados de clientes inesperado.",
            "danger"
          );
          console.error("[Frontend] Formato de dados inesperado:", data);
        }
      } catch (error) {
        console.error(
          "[Frontend] Erro na requisição de busca de clientes (catch):",
          error
        );
        showFeedback(
          `Erro na comunicação com o servidor: ${error.message}.`,
          "danger"
        );
      } finally {
        toggleMainLoadingOverlay(false);
      }
    }

    // Filtra os clientes com base na entrada do usuário
    function filterClients() {
      const searchTerm = searchInput.val().toLowerCase().trim();
      if (!searchTerm) {
        renderClientsTable(allClients);
        return;
      }
      const filteredClients = allClients.filter(client =>
        (client.cnpj && client.cnpj.includes(searchTerm)) ||
        (client.razao_social && client.razao_social.toLowerCase().includes(searchTerm)) ||
        (client.nome_fantasia && client.nome_fantasia.toLowerCase().includes(searchTerm))
      );
      renderClientsTable(filteredClients);
    }

    // Exibe os detalhes do cliente no modal
    async function showClientDetails(clientId) {
      // Verifica se o modal existe
      if (!clientDetailModal) {
        console.error("[Frontend] Modal de detalhes do cliente não encontrado");
        showFeedback("Modal de detalhes não disponível", "danger");
        return;
      }

      toggleLoading(true);
      $("#client-details-content").hide();

      try {
        console.log(
          `[Frontend] Tentando buscar detalhes do cliente ID: ${clientId}`
        );
        const response = await fetch(
          `${APP_CONFIG.API_BASE_URL}/api/clientes/${clientId}`
        );

        console.log(
          `[Frontend] Resposta da API para detalhes: Status ${response.status}, OK: ${response.ok}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[Frontend] Erro HTTP ao buscar detalhes: ${response.status} - ${response.statusText}. Resposta: ${errorText}`
          );
          showFeedback(
            `Erro ao carregar detalhes do cliente: ${response.status} ${response.statusText}.`,
            "danger"
          );
          return;
        }

        const result = await response.json();
        console.log("[Frontend] Detalhes do cliente recebidos:", result);

        if (Array.isArray(result) && result.length > 0) {
          const client = result[0];

          // Verifica se os elementos do modal existem antes de usá-los
          if (detailCnpj.length) detailCnpj.text(formatCnpj(client.cnpj));
          if (detailRazaoSocial.length) detailRazaoSocial.text(client.razao_social || "N/A");
          if (detailNomeFantasia.length) detailNomeFantasia.text(client.nome_fantasia || "N/A");
          if (detailNomeContato.length) detailNomeContato.text(client.nome_contato || "N/A");
          if (detailEndereco.length) detailEndereco.text(client.endereco || "N/A");
          if (detailCidadeUf.length) detailCidadeUf.text(
            `${client.cidade || "N/A"}/${client.uf || "N/A"}`
          );
          if (detailCep.length) detailCep.text(formatCep(client.cep));
          if (detailEmailContato.length) detailEmailContato.text(client.email_contato || "N/A");
          if (detailTelefoneContato.length) detailTelefoneContato.text(formatPhone(client.telefone_contato));
          if (detailWhatsappNumero.length) detailWhatsappNumero.text(formatPhone(client.whatsapp_numero));
          if (detailAtivo.length) detailAtivo.text(client.ativo ? "Ativo" : "Inativo");
          if (detailDataCadastro.length) detailDataCadastro.text(
            client.data_cadastro
              ? new Date(client.data_cadastro).toLocaleDateString("pt-BR")
              : "N/A"
          );

          if (detailMateriaisVendidos.length) detailMateriaisVendidos.text(
            client.materiais_vendidos && client.materiais_vendidos !== "Nenhum"
              ? client.materiais_vendidos
              : "Nenhum"
          );

          if (editClientModalBtn.length) editClientModalBtn.data("id", client.id);

          $("#client-details-content").show();
          clientDetailModal.show();
        } else {
          showFeedback(
            result.message || "Detalhes do cliente não encontrados.",
            "danger"
          );
          console.warn(
            "[Frontend] Detalhes do cliente não encontrados ou formato inesperado:",
            result
          );
        }
      } catch (error) {
        console.error(
          "[Frontend] Erro ao buscar detalhes do cliente (catch):",
          error
        );
        showFeedback(
          `Erro na comunicação com o servidor ao buscar detalhes: ${error.message}`,
          "danger"
        );
      } finally {
        toggleLoading(false);
      }
    }

    // --- Manipuladores de Eventos ---

    function handleClientRowClick(e) {
      // Navega apenas se o clique não for nos botões de ação
      if (!$(e.target).closest(".action-buttons").length) {
        const clientId = $(this).data("id");
        console.log(`[Frontend] Linha do cliente clicada. ID: ${clientId}`);
        showClientDetails(clientId);
      }
    }
    
    function handleEditClientClick(e) {
      e.stopPropagation();
      e.preventDefault();
      
      const clientId = $(this).data("id");
      console.log(
        `[Frontend] Botão 'Editar Cliente' clicado na linha. ID: ${clientId}`
      );
      console.log("[Frontend] Elemento clicado:", this);
      console.log("[Frontend] Data ID:", $(this).data("id"));
      
      if (!clientId) {
        console.error("[Frontend] ID do cliente não encontrado no botão");
        showFeedback("Erro: ID do cliente não encontrado", "danger");
        return;
      }
      
      // Navega para a página de alteração de cadastro com o ID do cliente
      window.location.hash = `#/alteracao-cadastro?id=${clientId}`;
      
      // Força o carregamento da página
      console.log("[Frontend] appUtils disponível:", !!window.appUtils);
      console.log("[Frontend] loadContent disponível:", !!(window.appUtils && window.appUtils.loadContent));
      
      if (window.appUtils && window.appUtils.loadContent) {
        console.log("[Frontend] Carregando página de alteração de cadastro...");
        window.appUtils.loadContent('alteracao-cadastro');
      } else {
        console.error("[Frontend] appUtils.loadContent não disponível");
        // Fallback: recarrega a página com o hash
        window.location.reload();
      }
    }

    function handleDeleteClientClick(e) {
      e.stopPropagation();
      const clientId = $(this).data("id");
      // Ajuste no índice para pegar o nome correto após a remoção da coluna Razão Social
      // Se Razão Social era a 2ª coluna (índice 1), e foi removida,
      // Nome Fantasia (que era a 3ª, índice 2) agora é a 2ª (índice 1).
      // Por enquanto, vou manter o nome fantasia como referência para a mensagem.
      const clientName = $(this)
        .closest("tr")
        .find("td:nth-child(2)")
        .text(); // Agora pega Nome Fantasia
      console.log(
        `[Frontend] Botão 'Inativar/Excluir Cliente' clicado. ID: ${clientId}, Nome: ${clientName}`
      );
      if (
        confirm(
          `Tem certeza que deseja inativar/excluir o cliente "${clientName}"? \n(Esta ação pode ser desfeita na tela de Alteração de Cadastro)`
        )
      ) {
        showFeedback(
          `Funcionalidade de exclusão/inativação para ${clientName} (ID: ${clientId}) será implementada.`,
          "info"
        );
      }
    }

    // Anexa os manipuladores de eventos
    function attachEventListeners() {
      searchInput.on("keyup", filterClients);
      addNewClientBtn.on("click", () => window.location.hash = '#/cadastro-clientes');
      
      // Os event listeners para os botões da tabela são anexados na renderClientsTable
      // para garantir que sejam anexados após os elementos serem criados
    }

    // Remove os manipuladores de eventos
    function detachEventListeners() {
      searchInput.off("keyup", filterClients);
      addNewClientBtn.off("click");
      
      // Remove os event listeners dos botões da tabela
      $(".client-row").off("click");
      $(".edit-client-btn").off("click");
      $(".delete-client-btn").off("click");
    }

    // --- Funções de Ciclo de Vida (para main.js) ---

    // Função de inicialização chamada pelo roteador principal (main.js)
    function initListaClientes() {
      console.log("[Frontend] initListaClientes: Inicializando a lista de clientes.");
      fetchClients();
      attachEventListeners();
    }

    // Função de limpeza chamada pelo roteador principal
    function cleanupListaClientes() {
      console.log("[Frontend] cleanupListaClientes: Limpando a lista de clientes.");
      detachEventListeners();
      allClients = []; // Limpa os dados em memória
    }

    // Expõe as funções de inicialização e limpeza para o escopo global
    window.initListaClientes = initListaClientes;
    window.cleanupListaClientes = cleanupListaClientes;
  })(); // Função auto-executável
}
