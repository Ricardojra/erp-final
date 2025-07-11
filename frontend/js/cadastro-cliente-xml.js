/**
 * cadastro-cliente-xml.js
 * Script para o módulo de Cadastro de Clientes por XML.
 * Este script é inicializado pela função window.initCadastroClienteXML,
 * garantindo que jQuery já esteja carregado.
 */

console.log("[Frontend] cadastro-cliente-xml.js: Script file loaded.");

// Verifica se jQuery está definido antes de prosseguir
if (typeof jQuery === "undefined") {
  console.error(
    "[Frontend] jQuery não está carregado. Certifique-se de que o jQuery CDN está no main.html antes deste script."
  );
  const feedbackTarget = document.getElementById("feedback-message");
  if (feedbackTarget) {
    feedbackTarget.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                Erro: jQuery não carregado. A funcionalidade de cadastro não pode ser exibida.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
  }
} else {
  // Usa $(function() { ... }); para garantir que o DOM esteja pronto
  $(function () {
    console.log(
      "[Frontend] jQuery está carregado. Iniciando script cadastro-cliente-xml.js."
    );

    // --- Elementos da interface (jQuery selectors) ---
    const $xmlFileInput = $("#xml-file-input");
    const $processXmlBtn = $("#process-xml-btn");
    const $clearXmlBtn = $("#clear-xml-btn");
    const $clientForm = $("#client-form");
    const $saveClientBtn = $("#save-client-btn");
    const $loadingOverlay = $("#loading-overlay");
    const $feedbackMessage = $("#feedback-message");

    // Campos do formulário
    const $cnpjField = $("#cnpj");
    const $razaoSocialField = $("#razao-social");
    const $nomeFantasiaField = $("#nome-fantasia");
    const $enderecoField = $("#endereco");
    const $cidadeField = $("#cidade");
    const $ufField = $("#uf");
    const $cepField = $("#cep");
    const $emailContatoField = $("#email-contato");
    const $telefoneContatoField = $("#telefone-contato");
    const $whatsappNumeroField = $("#whatsapp-numero");
    const $nomeContatoField = $("#nome-contato");

    // --- Constantes ---
    const API_BASE_URL = "http://localhost:3000"; // Ajuste para a URL do seu backend

    // --- Variáveis de Estado ---
    let xmlData = null; // Armazena os dados extraídos do XML

    // --- Funções Auxiliares ---

    /**
     * Exibe mensagens de feedback para o usuário
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo da mensagem ('success', 'danger', 'warning', 'info')
     */
    function showFeedback(message, type = "info") {
      $feedbackMessage.html(`
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `);
    }

    /**
     * Alterna a visibilidade do overlay de carregamento
     * @param {boolean} show - true para mostrar, false para ocultar
     */
    function toggleLoading(show) {
      $loadingOverlay.toggleClass("active", show);
      $processXmlBtn.prop("disabled", show);
      $saveClientBtn.prop("disabled", show);
    }

    /**
     * Limpa todos os campos do formulário
     */
    function clearForm() {
      $cnpjField.val("");
      $razaoSocialField.val("");
      $nomeFantasiaField.val("");
      $enderecoField.val("");
      $cidadeField.val("");
      $ufField.val("");
      $cepField.val("");
      $emailContatoField.val("");
      $telefoneContatoField.val("");
      $whatsappNumeroField.val("");
      $nomeContatoField.val("");
      $xmlFileInput.val("");
      xmlData = null;
      $saveClientBtn.prop("disabled", true);
      $feedbackMessage.empty();
    }

    /**
     * Preenche o formulário com os dados extraídos do XML
     * @param {Object} data - Dados extraídos do XML
     */
    function fillFormWithXmlData(data) {
      $cnpjField.val(data.cnpj || "");
      $razaoSocialField.val(data.razaoSocial || "");
      $nomeFantasiaField.val(data.nomeFantasia || "");
      $enderecoField.val(data.endereco || "");
      $cidadeField.val(data.cidade || "");
      $ufField.val(data.uf || "");
      $cepField.val(data.cep || "");
      $emailContatoField.val(data.emailContato || "");
      $telefoneContatoField.val(data.telefoneContato || "");
      $whatsappNumeroField.val(data.whatsappNumero || "");
      $nomeContatoField.val(data.nomeContato || "");
      
      // Habilita o botão de salvar se temos dados válidos
      if (data.cnpj && data.razaoSocial) {
        $saveClientBtn.prop("disabled", false);
      }
    }

    /**
     * Extrai dados do XML da nota fiscal
     * @param {string} xmlText - Conteúdo do XML
     * @returns {Object} Dados extraídos do XML
     */
    function extractDataFromXml(xmlText) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Verifica se o XML é válido
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
          throw new Error("XML inválido ou malformado");
        }

        // Função auxiliar para extrair texto de elementos
        const getElementText = (parent, tags) => {
          let currentElement = parent;
          for (const tag of tags) {
            if (!currentElement) return null;
            currentElement = currentElement.getElementsByTagName(tag)[0];
          }
          return currentElement?.textContent?.trim() || null;
        };

        // Busca a seção infNFe
        const infNFe = xmlDoc.getElementsByTagName("infNFe")[0];
        if (!infNFe) {
          throw new Error("Tag <infNFe> não encontrada no XML");
        }

        // Extrai dados do emitente (cliente)
        const emit = infNFe.getElementsByTagName("emit")[0];
        if (!emit) {
          throw new Error("Dados do emitente não encontrados no XML");
        }

        // Extrai dados do endereço
        const enderEmit = emit.getElementsByTagName("enderEmit")[0];
        
        const cnpj = getElementText(emit, ["CNPJ"]);
        const razaoSocial = getElementText(emit, ["xNome"]);
        const nomeFantasia = getElementText(emit, ["xFant"]);
        
        // Endereço
        const endereco = enderEmit ? [
          getElementText(enderEmit, ["xLgr"]),
          getElementText(enderEmit, ["nro"]),
          getElementText(enderEmit, ["xCpl"])
        ].filter(Boolean).join(", ") : "";
        
        const cidade = getElementText(enderEmit, ["xMun"]);
        const uf = getElementText(enderEmit, ["UF"]);
        const cep = getElementText(enderEmit, ["CEP"]);

        // Validações básicas
        if (!cnpj || cnpj.length !== 14) {
          throw new Error("CNPJ inválido ou não encontrado no XML");
        }

        if (!razaoSocial) {
          throw new Error("Razão Social não encontrada no XML");
        }

        return {
          cnpj: cnpj.replace(/\D/g, ""), // Remove caracteres não numéricos
          razaoSocial,
          nomeFantasia,
          endereco,
          cidade,
          uf,
          cep: cep ? cep.replace(/\D/g, "") : "",
          emailContato: "",
          telefoneContato: "",
          whatsappNumero: "",
          nomeContato: ""
        };

      } catch (error) {
        console.error("Erro ao extrair dados do XML:", error);
        throw new Error(`Erro ao processar XML: ${error.message}`);
      }
    }

    /**
     * Processa o arquivo XML selecionado
     */
    async function processXmlFile() {
      const file = $xmlFileInput[0].files[0];
      
      if (!file) {
        showFeedback("Por favor, selecione um arquivo XML.", "warning");
        return;
      }

      if (!file.name.toLowerCase().endsWith('.xml')) {
        showFeedback("Por favor, selecione um arquivo XML válido.", "warning");
        return;
      }

      toggleLoading(true);
      $feedbackMessage.empty();

      try {
        // Lê o arquivo XML
        const xmlText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(new Error("Erro na leitura do arquivo"));
          reader.readAsText(file);
        });

        // Extrai dados do XML
        xmlData = extractDataFromXml(xmlText);
        
        // Preenche o formulário com os dados extraídos
        fillFormWithXmlData(xmlData);
        
        showFeedback(
          `XML processado com sucesso! Dados extraídos: ${xmlData.razaoSocial} (CNPJ: ${xmlData.cnpj})`,
          "success"
        );

      } catch (error) {
        console.error("Erro ao processar XML:", error);
        showFeedback(`Erro ao processar XML: ${error.message}`, "danger");
        clearForm();
      } finally {
        toggleLoading(false);
      }
    }

    /**
     * Salva o cliente no banco de dados
     */
    async function saveClient() {
      // Coleta dados do formulário
      const clientData = {
        cnpj: $cnpjField.val().replace(/\D/g, ""),
        razao_social: $razaoSocialField.val().trim(),
        nome_fantasia: $nomeFantasiaField.val().trim(),
        endereco: $enderecoField.val().trim(),
        cidade: $cidadeField.val().trim(),
        uf: $ufField.val().trim(),
        cep: $cepField.val().replace(/\D/g, ""),
        email_contato: $emailContatoField.val().trim(),
        telefone_contato: $telefoneContatoField.val().trim(),
        whatsapp_numero: $whatsappNumeroField.val().trim(),
        nome_contato: $nomeContatoField.val().trim()
      };

      // Validações
      if (!clientData.cnpj || clientData.cnpj.length !== 14) {
        showFeedback("CNPJ deve conter 14 dígitos.", "danger");
        return;
      }

      if (!clientData.razao_social) {
        showFeedback("Razão Social é obrigatória.", "danger");
        return;
      }

      toggleLoading(true);
      $feedbackMessage.empty();

      try {
        const response = await fetch(`${API_BASE_URL}/api/clientes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(clientData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showFeedback(
            `Cliente ${clientData.razao_social} salvo com sucesso!`,
            "success"
          );
          
          // Limpa o formulário após salvar com sucesso
          setTimeout(() => {
            clearForm();
          }, 2000);
          
        } else {
          showFeedback(
            result.message || "Erro ao salvar cliente.",
            "danger"
          );
        }

      } catch (error) {
        console.error("Erro ao salvar cliente:", error);
        showFeedback(
          `Erro na comunicação com o servidor: ${error.message}`,
          "danger"
        );
      } finally {
        toggleLoading(false);
      }
    }

    // --- Event Handlers ---

    // Evento de clique no botão "Processar XML"
    $processXmlBtn.on("click", processXmlFile);

    // Evento de clique no botão "Limpar"
    $clearXmlBtn.on("click", function() {
      clearForm();
      showFeedback("Formulário limpo.", "info");
    });

    // Evento de submissão do formulário
    $clientForm.on("submit", function(e) {
      e.preventDefault();
      saveClient();
    });

    // Evento de mudança no arquivo XML
    $xmlFileInput.on("change", function() {
      if (this.files.length > 0) {
        const fileName = this.files[0].name;
        showFeedback(`Arquivo selecionado: ${fileName}`, "info");
      }
    });

    // Evento de mudança nos campos para habilitar/desabilitar botão de salvar
    $clientForm.on("input", "input", function() {
      const cnpj = $cnpjField.val().replace(/\D/g, "");
      const razaoSocial = $razaoSocialField.val().trim();
      
      if (cnpj.length === 14 && razaoSocial) {
        $saveClientBtn.prop("disabled", false);
      } else {
        $saveClientBtn.prop("disabled", true);
      }
    });

    // --- Funções de Inicialização e Limpeza ---

    /**
     * Função de inicialização chamada pelo main.js
     */
    window.initCadastroClienteXML = function() {
      console.log("[Frontend] initCadastroClienteXML: Inicializando o cadastro de clientes por XML.");
      
      // Limpa o formulário na inicialização
      clearForm();
      
      // Foca no campo de arquivo XML
      $xmlFileInput.focus();
    };

    /**
     * Função de limpeza chamada pelo main.js
     */
    window.cleanupCadastroClienteXML = function() {
      console.log("[Frontend] cleanupCadastroClienteXML: Limpando o cadastro de clientes por XML.");
      
      // Remove event listeners
      $processXmlBtn.off("click");
      $clearXmlBtn.off("click");
      $clientForm.off("submit");
      $xmlFileInput.off("change");
      $clientForm.off("input", "input");
      
      // Limpa o formulário
      clearForm();
      
      // Limpa variáveis de estado
      xmlData = null;
    };

  }); // Fim de $(function() { ... });
}
