$(document).ready(function () {
  // Elementos da interface de busca
  const searchCnpjField = $("#search-cnpj");
  const searchClientBtn = $("#search-client-btn");
  const searchFeedback = $("#search-feedback");

  // Seção do formulário do cliente
  const clientFormSection = $("#client-form-section");

  // Campos do formulário do cliente
  const clientIdField = $("#client-id"); // Campo oculto para o ID do cliente
  const cnpjField = $("#cnpj");
  const razaoSocialField = $("#razao-social");
  const nomeFantasiaField = $("#nome-fantasia");
  const nomeContatoField = $("#nome-contato");
  const enderecoField = $("#endereco");
  const cidadeField = $("#cidade");
  const ufField = $("#uf");
  const cepField = $("#cep");
  const emailContatoField = $("#email-contato");
  const telefoneContatoField = $("#telefone-contato");
  const whatsappNumeroField = $("#whatsapp-numero");
  const ativoField = $("#ativo"); // Campo para status ativo/inativo

  const clientForm = $("#client-form");
  const updateClientBtn = $("#update-client-btn");
  const loadingOverlay = $("#loading-overlay");
  const feedbackMessage = $("#feedback-message");

  // URL base da API do backend
  const API_BASE_URL = "http://localhost:3000"; // Ajuste para a URL do seu backend

  // --- Funções Auxiliares ---

  // Exibe mensagens de feedback para o usuário
  function showFeedback(message, type = "info", target = feedbackMessage) {
    target.html(`
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
  }

  // Alterna a visibilidade do overlay de carregamento
  function toggleLoading(show) {
    loadingOverlay.toggleClass("active", show);
    searchClientBtn.prop("disabled", show);
    updateClientBtn.prop("disabled", show);
  }

  // Limpa todos os campos do formulário do cliente e oculta a seção
  function clearClientForm() {
    clientIdField.val("");
    cnpjField.val("");
    razaoSocialField.val("");
    nomeFantasiaField.val("");
    nomeContatoField.val("");
    enderecoField.val("");
    cidadeField.val("");
    ufField.val("");
    cepField.val("");
    emailContatoField.val("");
    telefoneContatoField.val("");
    whatsappNumeroField.val("");
    ativoField.val("true"); // Volta para ativo por padrão
    clientFormSection.hide(); // Oculta o formulário
    updateClientBtn.prop("disabled", true);
    searchFeedback.empty(); // Limpa feedback de busca
  }

  // Preenche o formulário com os dados do cliente
  function prefillForm(clientData) {
    clientIdField.val(clientData.id || "");
    cnpjField.val(clientData.cnpj || "");
    razaoSocialField.val(clientData.razao_social || "");
    nomeFantasiaField.val(clientData.nome_fantasia || "");
    nomeContatoField.val(clientData.nome_contato || "");
    enderecoField.val(clientData.endereco || "");
    cidadeField.val(clientData.cidade || "");
    ufField.val(clientData.uf || "");
    cepField.val(clientData.cep || "");
    emailContatoField.val(clientData.email_contato || "");
    telefoneContatoField.val(clientData.telefone_contato || "");
    whatsappNumeroField.val(clientData.whatsapp_numero || "");
    ativoField.val(clientData.ativo ? "true" : "false"); // Define o status ativo/inativo

    clientFormSection.show(); // Mostra o formulário
    updateClientBtn.prop("disabled", false); // Habilita o botão de atualização
  }

  // --- Event Handlers ---

  // Evento de clique do botão de busca
  searchClientBtn.on("click", async function () {
    const cnpj = searchCnpjField.val().replace(/\D/g, ""); // Limpa o CNPJ

    if (!cnpj || cnpj.length !== 14) {
      showFeedback(
        "Por favor, digite um CNPJ válido (14 dígitos).",
        "warning",
        searchFeedback
      );
      clearClientForm();
      return;
    }

    toggleLoading(true);
    searchFeedback.empty(); // Limpa mensagens anteriores de busca
    feedbackMessage.empty(); // Limpa mensagens gerais

    try {
      const response = await fetch(`${API_BASE_URL}/api/clientes/cnpj/${cnpj}`);
      const result = await response.json();

      if (response.ok && result) {
        if (result.length > 0) {
          // A rota de busca pode retornar um array
          prefillForm(result[0]); // Pega o primeiro cliente encontrado
          showFeedback(
            "Cliente encontrado com sucesso!",
            "success",
            searchFeedback
          );
        } else {
          showFeedback(
            `Cliente com CNPJ ${cnpj} não encontrado.`,
            "info",
            searchFeedback
          );
          clearClientForm();
        }
      } else {
        showFeedback(
          result.message || "Erro ao buscar cliente.",
          "danger",
          searchFeedback
        );
        clearClientForm();
        console.error("Erro do servidor ao buscar:", result.error);
      }
    } catch (error) {
      console.error("Erro na requisição de busca:", error);
      showFeedback(
        `Erro na comunicação com o servidor: ${error.message}`,
        "danger",
        searchFeedback
      );
      clearClientForm();
    } finally {
      toggleLoading(false);
    }
  });

  // Evento de submissão do formulário de atualização
  clientForm.on("submit", async function (e) {
    e.preventDefault(); // Previne o envio padrão do formulário

    const clientId = clientIdField.val();
    if (!clientId) {
      showFeedback(
        "Erro: ID do cliente não encontrado para atualização.",
        "danger"
      );
      return;
    }

    const clientData = {
      cnpj: cnpjField.val().replace(/\D/g, ""),
      razao_social: razaoSocialField.val(),
      nome_fantasia: nomeFantasiaField.val(),
      nome_contato: nomeContatoField.val(),
      endereco: enderecoField.val(),
      cidade: cidadeField.val(),
      uf: ufField.val(),
      cep: cepField.val().replace(/\D/g, ""),
      email_contato: emailContatoField.val(),
      telefone_contato: telefoneContatoField.val(),
      whatsapp_numero: whatsappNumeroField.val(),
      ativo: ativoField.val() === "true", // Converte para boolean
    };

    // Validação básica antes de enviar
    if (!clientData.cnpj || clientData.cnpj.length !== 14) {
      showFeedback("CNPJ inválido. Deve conter 14 dígitos.", "danger");
      return;
    }
    if (!clientData.razao_social) {
      showFeedback("Razão Social é obrigatória.", "danger");
      return;
    }

    toggleLoading(true);
    try {
      // Usando PUT para atualização de recurso existente
      const response = await fetch(`${API_BASE_URL}/api/clientes/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      const result = await response.json();

      if (response.ok) {
        showFeedback(
          result.message || "Cliente atualizado com sucesso!",
          "success"
        );
        // Opcional: recarregar os dados do cliente após a atualização para garantir consistência
        // searchClientBtn.trigger('click');
      } else {
        showFeedback(result.message || "Erro ao atualizar cliente.", "danger");
        console.error("Erro do servidor:", result.error);
      }
    } catch (error) {
      console.error("Erro na requisição de atualização:", error);
      showFeedback(
        `Erro na comunicação com o servidor: ${error.message}`,
        "danger"
      );
    } finally {
      toggleLoading(false);
    }
  });

  // Limpa o formulário ao carregar a página
  clearClientForm();

  // Função para carregar cliente por ID da URL
  async function loadClientById(clientId) {
    if (!clientId) return;

    toggleLoading(true);
    searchFeedback.empty();
    feedbackMessage.empty();

    try {
      const response = await fetch(`${API_BASE_URL}/api/clientes/${clientId}`);
      const result = await response.json();

      if (response.ok && result) {
        if (Array.isArray(result) && result.length > 0) {
          prefillForm(result[0]);
          showFeedback(
            "Cliente carregado automaticamente para edição.",
            "success",
            searchFeedback
          );
        } else {
          showFeedback(
            "Cliente não encontrado.",
            "danger",
            searchFeedback
          );
        }
      } else {
        showFeedback(
          result.message || "Erro ao carregar cliente.",
          "danger",
          searchFeedback
        );
      }
    } catch (error) {
      console.error("Erro ao carregar cliente por ID:", error);
      showFeedback(
        `Erro na comunicação com o servidor: ${error.message}`,
        "danger",
        searchFeedback
      );
    } finally {
      toggleLoading(false);
    }
  }

  // Função de inicialização
  function initAlteracaoCadastro() {
    console.log("[Frontend] initAlteracaoCadastro: Inicializando alteração de cadastro.");
    console.log("[Frontend] URL atual:", window.location.href);
    console.log("[Frontend] Hash atual:", window.location.hash);
    console.log("[Frontend] Search atual:", window.location.search);
    
    // Verifica se há um ID na URL (tanto na query string quanto no hash)
    let clientId = null;
    
    // Primeiro tenta ler da query string
    const urlParams = new URLSearchParams(window.location.search);
    clientId = urlParams.get('id');
    console.log("[Frontend] ID da query string:", clientId);
    
    // Se não encontrar, tenta ler do hash
    if (!clientId) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      clientId = hashParams.get('id');
      console.log("[Frontend] ID do hash:", clientId);
    }
    
    if (clientId) {
      console.log(`[Frontend] ID do cliente encontrado na URL: ${clientId}`);
      loadClientById(clientId);
    } else {
      console.log("[Frontend] Nenhum ID de cliente na URL. Modo de busca por CNPJ.");
    }
  }

  // Função de limpeza
  function cleanupAlteracaoCadastro() {
    console.log("[Frontend] cleanupAlteracaoCadastro: Limpando alteração de cadastro.");
    clearClientForm();
  }

  // Expõe as funções para o escopo global
  window.initAlteracaoCadastro = initAlteracaoCadastro;
  window.cleanupAlteracaoCadastro = cleanupAlteracaoCadastro;

  // Inicializa automaticamente se não estiver sendo carregado pelo main.js
  if (typeof window.initAlteracaoCadastro === 'undefined') {
    initAlteracaoCadastro();
  }
});
