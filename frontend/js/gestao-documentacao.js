console.log("[Frontend] gestao-documentacao.js: Script file loaded.");

if (typeof jQuery === "undefined") {
  console.error(
    "[Frontend] jQuery não está carregado. Certifique-se de que o jQuery CDN está no main.html antes deste script."
  );
  const feedbackTarget = document.getElementById(
    "document-list-feedback-message"
  );
  if (feedbackTarget) {
    feedbackTarget.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                Erro: jQuery não carregado. A gestão de documentos não pode ser exibida.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
  }
} else {
  (function () {
    console.log(
      "[Frontend] jQuery está carregado. Iniciando script gestao-documentacao.js."
    );

    // Elementos da interface
    const documentsTableBody = $("#documents-table-body");
    const uploadDocumentForm = $("#upload-document-form");
    const uploadDocumentModal = new bootstrap.Modal(
      document.getElementById("uploadDocumentModal")
    );
    const viewDocumentModal = new bootstrap.Modal(
      document.getElementById("viewDocumentModal")
    );
    const documentViewerIframe = $("#document-viewer-iframe");
    const documentsLoadingOverlay = $("#documents-loading-overlay");
    const documentListFeedbackMessage = $("#document-list-feedback-message");
    const uploadFeedbackMessage = $("#upload-feedback-message");
    const uploadSpinner = $("#upload-spinner");

    // Elementos do formulário de upload
    const uploadClienteSelect = $("#upload-cliente-select");
    const uploadTipoDocumentoSelect = $("#upload-tipo-documento-select");
    const validityDateGroup = $("#validity-date-group");
    const docValidityDateInput = $("#doc-validity-date");
    const docFileInput = $("#doc-file");

    // Elemento do filtro de cliente
    const filterClientSelect = $("#filter-client-select");

    const API_BASE_URL = "http://localhost:3000"; // Ajuste para a URL do seu backend

    let allClients = []; // Para armazenar a lista de clientes
    let allDocumentTypes = []; // Para armazenar a lista de tipos de documento

    // --- Funções Auxiliares ---

    function showFeedback(
      message,
      type = "info",
      target = documentListFeedbackMessage
    ) {
      target.html(`
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `);
    }

    function toggleLoading(show, targetOverlay = documentsLoadingOverlay) {
      console.log(`[Frontend] toggleLoading: ${show ? 'Mostrando' : 'Ocultando'} overlay de carregamento`);
      
      if (show) {
        targetOverlay.show().addClass("active");
      } else {
        targetOverlay.hide().removeClass("active");
      }
      
      // Garantir que o overlay seja removido após um timeout de segurança
      if (!show) {
        setTimeout(() => {
          targetOverlay.hide().removeClass("active");
        }, 100);
      }
    }

    function formatDate(dateString) {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Verifica se a data é inválida
        return "Data Inválida";
      }
      return date.toLocaleDateString("pt-BR");
    }

    // Renderiza a tabela de documentos
    function renderDocumentsTable(documentsToRender) {
      console.log(
        "[Frontend] renderDocumentsTable: Iniciando renderização da tabela."
      );
      documentsTableBody.empty();

      if (
        !documentsToRender ||
        !Array.isArray(documentsToRender) ||
        documentsToRender.length === 0
      ) {
        console.log(
          "[Frontend] renderDocumentsTable: Nenhuns documentos para renderizar ou formato inválido."
        );
        documentsTableBody.append(
          '<tr><td colspan="7" class="text-center">Nenhum documento encontrado.</td></tr>'
        );
        return;
      }

      console.log(
        `[Frontend] renderDocumentsTable: Tentando renderizar ${documentsToRender.length} documentos.`
      );
      let rowsHtml = "";
      documentsToRender.forEach((doc) => {
        console.log("[Frontend] Renderizando documento:", doc);
        const validityClass =
          doc.status_validade === "Expirado"
            ? "text-danger fw-bold"
            : doc.status_validade === "Válido"
            ? "text-success"
            : "text-muted";
        const row = `
                    <tr data-id="${doc.id}">
                        <td>${doc.cliente_razao_social || "N/A"}</td>
                        <td>${doc.nome_documento_tipo || "N/A"}</td>
                        <td>${formatDate(doc.data_validade)}</td>
                        <td class="${validityClass}">${
          doc.status_validade || "N/A"
        }</td>
                        <td>${formatDate(doc.data_upload)}</td>
                        <td>${doc.usuario_upload || "N/A"}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-info view-document-btn me-1" data-id="${
                              doc.id
                            }" title="Visualizar Documento">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-document-btn" data-id="${
                              doc.id
                            }" title="Inativar Documento">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
        rowsHtml += row;
      });
      documentsTableBody.append(rowsHtml);
      console.log(
        "[Frontend] renderDocumentsTable: Linhas da tabela adicionadas."
      );

      // Adiciona event listeners
      $(".view-document-btn")
        .off("click")
        .on("click", function () {
          const docId = $(this).data("id");
          viewDocument(docId);
        });

      $(".delete-document-btn")
        .off("click")
        .on("click", function () {
          const docId = $(this).data("id");
          const docName = $(this).closest("tr").find("td:nth-child(2)").text(); // Pega o tipo de documento
          const clientName = $(this)
            .closest("tr")
            .find("td:nth-child(1)")
            .text(); // Pega o nome do cliente
          if (
            confirm(
              `Tem certeza que deseja inativar o documento "${docName}" do cliente "${clientName}"?`
            )
          ) {
            deleteDocument(docId);
          }
        });
    }

    // --- Carregamento de Dados para Selects ---

    async function fetchClientsForSelect() {
      try {
        console.log("[Frontend] fetchClientsForSelect: Iniciando busca de clientes...");
        const response = await fetch(`${API_BASE_URL}/api/clientes`);
        if (!response.ok) throw new Error("Erro ao buscar clientes.");
        const result = await response.json();
        if (result.success && Array.isArray(result.clients)) {
          allClients = result.clients;
          uploadClienteSelect
            .empty()
            .append('<option value="">Selecione um cliente</option>');
          filterClientSelect
            .empty()
            .append('<option value="">Todos os Clientes</option>');
          allClients.forEach((client) => {
            const option = `<option value="${client.id}">${client.razao_social} (${client.cnpj})</option>`;
            uploadClienteSelect.append(option);
            filterClientSelect.append(option);
          });
          console.log("[Frontend] Clientes carregados para selects.");
        } else {
          console.error(
            "[Frontend] Formato de dados de clientes inesperado:",
            result
          );
        }
      } catch (error) {
        console.error("[Frontend] Erro ao buscar clientes:", error);
        showFeedback(
          `Erro ao carregar lista de clientes: ${error.message}`,
          "danger"
        );
      }
    }

    async function fetchDocumentTypesForSelect() {
      try {
        console.log("[Frontend] fetchDocumentTypesForSelect: Iniciando busca de tipos de documento...");
        const response = await fetch(`${API_BASE_URL}/api/documentos/tipos-documento`);
        if (!response.ok) throw new Error("Erro ao buscar tipos de documento.");
        const result = await response.json();
        if (result.success && Array.isArray(result.tipos_documento)) {
          allDocumentTypes = result.tipos_documento;
          uploadTipoDocumentoSelect
            .empty()
            .append('<option value="">Selecione o tipo de documento</option>');
          allDocumentTypes.forEach((type) => {
            const option = `<option value="${type.id}" data-requer-validade="${type.requer_validade}">${type.nome}</option>`;
            uploadTipoDocumentoSelect.append(option);
          });
          console.log("[Frontend] Tipos de documento carregados para select.");
        } else {
          console.error(
            "[Frontend] Formato de dados de tipos de documento inesperado:",
            result
          );
        }
      } catch (error) {
        console.error("[Frontend] Erro ao buscar tipos de documento:", error);
        showFeedback(
          `Erro ao carregar tipos de documento: ${error.message}`,
          "danger"
        );
      }
    }

    // --- Lógica de Busca e Carregamento de Documentos ---

    async function fetchDocuments(clienteId = null) {
      console.log(`[Frontend] fetchDocuments: Iniciando busca de documentos${clienteId ? ` para cliente ${clienteId}` : ''}`);
      toggleLoading(true);
      documentListFeedbackMessage.empty();

      try {
        let url = `${API_BASE_URL}/api/documentos`;
        if (clienteId) {
          url += `?cliente_id=${clienteId}`;
        }
        console.log(`[Frontend] Tentando buscar documentos de: ${url}`);
        const response = await fetch(url);

        console.log(
          `[Frontend] Resposta da API para documentos: Status ${response.status}, OK: ${response.ok}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[Frontend] Erro HTTP ao buscar documentos: ${response.status} - ${response.statusText}. Resposta: ${errorText}`
          );
          showFeedback(
            `Erro ao carregar documentos: ${response.status} ${response.statusText}. Verifique o console.`,
            "danger"
          );
          documentsTableBody
            .empty()
            .append(
              '<tr><td colspan="7" class="text-center">Erro ao carregar documentos. Verifique o console.</td></tr>'
            );
          return;
        }

        const result = await response.json();
        console.log("[Frontend] Dados de documentos recebidos:", result);

        if (result.success && Array.isArray(result.documentos)) {
          renderDocumentsTable(result.documentos);
          showFeedback(
            `Total de documentos: ${result.documentos.length}`,
            "info"
          );
        } else {
          showFeedback(
            result.message || "Formato de dados de documentos inesperado.",
            "danger"
          );
          documentsTableBody
            .empty()
            .append(
              '<tr><td colspan="7" class="text-center">Erro no formato dos dados recebidos.</td></tr>'
            );
          console.error("[Frontend] Formato de dados inesperado:", result);
        }
      } catch (error) {
        console.error(
          "[Frontend] Erro na requisição de busca de documentos (catch):",
          error
        );
        showFeedback(
          `Erro na comunicação com o servidor: ${error.message}.`,
          "danger"
        );
        documentsTableBody
          .empty()
          .append(
            '<tr><td colspan="7" class="text-center">Erro de rede ao carregar documentos.</td></tr>'
          );
      } finally {
        console.log("[Frontend] fetchDocuments: Finalizando e ocultando overlay");
        toggleLoading(false);
      }
    }

    // --- Lógica de Upload ---

    uploadDocumentForm.on("submit", async function (e) {
      e.preventDefault();
      uploadSpinner.removeClass("d-none");
      $(this).find('button[type="submit"]').prop("disabled", true);
      uploadFeedbackMessage.empty();

      const clienteId = uploadClienteSelect.val();
      const tipoDocumentoId = uploadTipoDocumentoSelect.val();
      const dataValidade = docValidityDateInput.val();
      const documentoFile = docFileInput[0].files[0];

      if (!clienteId || !tipoDocumentoId || !documentoFile) {
        showFeedback(
          "Por favor, preencha todos os campos obrigatórios (Cliente, Tipo de Documento, Arquivo).",
          "warning",
          uploadFeedbackMessage
        );
        uploadSpinner.addClass("d-none");
        $(this).find('button[type="submit"]').prop("disabled", false);
        return;
      }

      // Validação da data de validade baseada no tipo de documento
      const selectedDocType = allDocumentTypes.find(
        (type) => String(type.id) === tipoDocumentoId
      );
      if (selectedDocType && selectedDocType.requer_validade && !dataValidade) {
        showFeedback(
          "Este tipo de documento requer uma Data de Validade.",
          "warning",
          uploadFeedbackMessage
        );
        uploadSpinner.addClass("d-none");
        $(this).find('button[type="submit"]').prop("disabled", false);
        return;
      }

      const formData = new FormData();
      formData.append("cliente_id", clienteId);
      formData.append("tipo_documento_id", tipoDocumentoId);
      if (dataValidade) {
        formData.append("data_validade", dataValidade);
      }
      formData.append("documento", documentoFile); // 'documento' é o nome do campo esperado pelo Multer
      formData.append("usuario_upload", "Admin"); // Exemplo: você pode obter isso de um sistema de autenticação

      try {
        console.log("[Frontend] Tentando fazer upload de documento...");
        const response = await fetch(`${API_BASE_URL}/api/documentos/upload`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        console.log("[Frontend] Resposta do upload:", result);

        if (response.ok && result.success) {
          showFeedback(result.message, "success", uploadFeedbackMessage);
          uploadDocumentForm[0].reset(); // Limpa o formulário
          uploadDocumentModal.hide(); // Fecha o modal
          fetchDocuments(filterClientSelect.val()); // Recarrega a lista de documentos com o filtro atual
        } else {
          showFeedback(
            result.message || "Erro desconhecido no upload.",
            "danger",
            uploadFeedbackMessage
          );
        }
      } catch (error) {
        console.error("[Frontend] Erro no upload (catch):", error);
        showFeedback(
          `Erro na comunicação com o servidor: ${error.message}.`,
          "danger",
          uploadFeedbackMessage
        );
      } finally {
        uploadSpinner.addClass("d-none");
        $(this).find('button[type="submit"]').prop("disabled", false);
      }
    });

    // --- Lógica de Visualização ---

    function viewDocument(docId) {
      console.log(`[Frontend] Tentando visualizar documento ID: ${docId}`);
      const documentUrl = `${API_BASE_URL}/api/documentos/view/${docId}`;
      documentViewerIframe.attr("src", documentUrl);
      viewDocumentModal.show();
    }

    // --- Lógica de Inativação (Exclusão Lógica) ---
    async function deleteDocument(docId) {
      console.log(`[Frontend] Tentando inativar documento ID: ${docId}`);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/documentos/${docId}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();
        console.log("[Frontend] Resposta da inativação:", result);

        if (response.ok && result.success) {
          showFeedback(result.message, "success", documentListFeedbackMessage);
          fetchDocuments(filterClientSelect.val()); // Recarrega a lista com o filtro atual
        } else {
          showFeedback(
            result.message || "Erro ao inativar documento.",
            "danger",
            documentListFeedbackMessage
          );
        }
      } catch (error) {
        console.error("[Frontend] Erro na inativação (catch):", error);
        showFeedback(
          `Erro na comunicação com o servidor: ${error.message}.`,
          "danger",
          documentListFeedbackMessage
        );
      }
    }

    // --- Event Listeners ---

    // Controla a visibilidade do campo de data de validade
    uploadTipoDocumentoSelect.on("change", function () {
      const selectedOption = $(this).find("option:selected");
      // Certifique-se de que o atributo data-requer-validade é lido como um booleano
      const requerValidade = selectedOption.data("requer-validade") === true;
      if (requerValidade) {
        validityDateGroup.show();
        docValidityDateInput.prop("required", true);
      } else {
        validityDateGroup.hide();
        docValidityDateInput.prop("required", false).val(""); // Limpa e remove required
      }
    });

    // Evento de mudança no filtro de cliente
    filterClientSelect.on("change", function () {
      const selectedClientId = $(this).val();
      fetchDocuments(selectedClientId === "" ? null : selectedClientId);
    });

    // --- Inicialização ---

    // Carrega os selects e a lista de documentos ao carregar a página
    console.log("[Frontend] Iniciando carregamento dos dados...");
    
    // Timeout de segurança para garantir que o overlay seja removido
    setTimeout(() => {
      toggleLoading(false);
    }, 10000); // 10 segundos de timeout
    
    fetchClientsForSelect();
    fetchDocumentTypesForSelect();
    fetchDocuments(); // Carrega todos os documentos inicialmente
  })();
}
