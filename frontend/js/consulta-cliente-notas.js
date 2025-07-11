/**
 * consulta-cliente-notas.js
 * Script para o módulo de Consulta de Notas por Cliente.
 */

console.log("[Frontend] consulta-cliente-notas.js: Script file loaded.");

function initConsultaNotasCliente() {
    console.log("[Frontend] initConsultaNotasCliente: Inicializando módulo...");

    // --- Constantes e Utilidades Globais (obtidas de main.js) ---
    const APP_CONFIG = window.appUtils.APP_CONFIG;
    const fetchWithTimeout = window.appUtils.fetchWithTimeout.bind(window.appUtils);
    const showNotification = window.appUtils.showNotification.bind(window.appUtils);
    const toggleMainLoadingOverlay = window.appUtils.showLoading;

    // --- Elementos da interface (jQuery selectors) ---
    const $filterClientSelect = $("#filter-client-select");
    const $notesSummaryCardsContainer = $("#notes-summary-cards-container");
    const $materialCardsContainer = $("#material-cards-container");
    const $alertPlaceholder = $("#alert-placeholder-consulta-notas");
    const $yearFilter = $("#year-filter");
    const $searchNotesBtn = $("#search-notes-btn");
    const $limparFiltrosBtn = $("#limpar-filtros");
    let notesDataTable;

    // Modal de edição de status
    const editStatusModal = new bootstrap.Modal(document.getElementById("editStatusModal"));
    const $modalNoteNumber = $("#modal-note-number");
    const $editNoteId = $("#edit-note-id");
    const $editCurrentStatus = $("#edit-current-status");
    const $editNewStatus = $("#edit-new-status");
    const $saveStatusChangeBtn = $("#saveStatusChangeBtn");

    // --- Mapeamentos e Utilitários Locais ---
    const STATUS_MAP = {
      disponivel: { text: "Disponível", class: "badge bg-success" },
      enviada: { text: "Enviada", class: "badge bg-primary" },
      vendida: { text: "Vendida", class: "badge bg-info text-dark" },
      reprovada: { text: "Reprovada", class: "badge bg-danger" },
      pendente: { text: "Pendente", class: "badge bg-warning text-dark" },
      ofertada: { text: "Ofertada", class: "badge bg-secondary" },
    };

    // --- Funções de Manipulação de Eventos (Handlers) ---

    function handleSearchClick() {
        const selectedClient = $filterClientSelect.val();
        if (!selectedClient) {
            showFeedback("Atenção", "Por favor, selecione um cliente para iniciar a busca.", "warning");
            return;
        }
        const selectedYear = $yearFilter.val();
        loadClientNotes(selectedClient, selectedYear);
    }

    function handleClearFilters() {
        $filterClientSelect.val('').trigger('change');
        $yearFilter.val('');
        if (notesDataTable) {
            notesDataTable.clear().draw();
        }
        $notesSummaryCardsContainer.empty();
        $materialCardsContainer.empty();
        showFeedback("Filtros Limpos", "A visualização foi redefinida.", "info");
    }

    async function handleSaveStatusChange() {
        const noteId = $editNoteId.val();
        const newStatus = $editNewStatus.val();
        if (!newStatus) {
            showFeedback("Atenção", "Selecione um novo status.", "warning");
            return;
        }

        try {
            const response = await fetchWithTimeout(`${APP_CONFIG.API_BASE_URL}/api/notas-fiscais/reprocessar-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notaId: noteId, novoStatus: newStatus })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Erro ao atualizar status.');
            showFeedback("Sucesso", "Status da nota atualizado com sucesso!", "success");
            editStatusModal.hide();
            handleSearchClick(); // Refresh data
        } catch (error) {
            showFeedback("Erro", `Não foi possível alterar o status: ${error.message}`, "danger");
        }
    }
    
    // --- Funções de Lógica e Renderização ---

    async function initPage() {
        toggleMainLoadingOverlay(true);
        try {
            await Promise.all([loadClients(), populateYearFilter()]);
        } catch(error) {
            showFeedback("Erro Crítico", "Não foi possível carregar os filtros da página. Tente recarregar.", "danger");
        } finally {
            toggleMainLoadingOverlay(false);
        }
    }

    function showFeedback(title, message, type = "info") {
        const alertHtml = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <strong>${title}:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        $alertPlaceholder.html(alertHtml);
    }
    
    async function loadClients() {
        try {
            const response = await fetchWithTimeout(`${APP_CONFIG.API_BASE_URL}/api/clientes/`);
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            
            $filterClientSelect.empty().append('<option value="">Selecione um Cliente</option>');
            data.clients.forEach(client => {
                $filterClientSelect.append(new Option(client.razao_social, client.razao_social));
            });
            $filterClientSelect.select2({
                theme: "bootstrap-5",
                placeholder: $(this).data('placeholder'),
            });
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
            showFeedback("Erro de Rede", "Não foi possível carregar a lista de clientes.", "danger");
        }
    }
    
    async function populateYearFilter() {
        try {
            const response = await fetchWithTimeout(`${APP_CONFIG.API_BASE_URL}/api/notas-fiscais/years`);
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            
            $yearFilter.empty().append('<option value="">Todos os Anos</option>');
            data.years.forEach(year => {
                $yearFilter.append(new Option(year, year));
            });
        } catch (error) {
            console.error("Erro ao carregar anos:", error);
            showFeedback("Erro de Rede", "Não foi possível carregar os anos para o filtro.", "danger");
        }
    }
    
    async function loadClientNotes(clientName, year = "") {
        if (!clientName) return;
        toggleMainLoadingOverlay(true);
        try {
            const encodedClientName = encodeURIComponent(clientName);
            const url = `${APP_CONFIG.API_BASE_URL}/api/notas-fiscais/cliente/${encodedClientName}?ano=${year}`;
            const response = await fetchWithTimeout(url);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            updateSummaryCards(result.notas);
            updateMaterialCards(result.notas);
            updateNotesTable(result.notas);
        } catch (error) {
            showFeedback("Erro ao Buscar Notas", error.message, "danger");
        } finally {
            toggleMainLoadingOverlay(false);
        }
    }
    
    function updateSummaryCards(notas) {
        const summary = notas.reduce((acc, nota) => {
            acc[nota.status] = (acc[nota.status] || 0) + 1;
            return acc;
        }, {});

        // Calcula a quantidade total disponível (apenas notas com status 'disponivel')
        const quantidadeDisponivel = notas
            .filter(nota => nota.status === 'disponivel')
            .reduce((total, nota) => total + parseFloat(nota.quantidade || 0), 0);
        
        const quantidadeDisponivelTon = quantidadeDisponivel / 1000;
        const quantidadeFormatada = quantidadeDisponivelTon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        $notesSummaryCardsContainer.empty();
        
        // Adiciona card de quantidade total disponível
        const cardQuantidadeDisponivel = `
            <div class="col">
                <div class="card text-center border-success">
                    <div class="card-body">
                        <h6 class="card-title text-success">
                            <i class="fas fa-weight-hanging me-2"></i>Quantidade Disponível
                        </h6>
                        <p class="card-text fs-4 text-success">${quantidadeFormatada} Ton</p>
                    </div>
                </div>
            </div>`;
        $notesSummaryCardsContainer.append(cardQuantidadeDisponivel);
        
        // Adiciona cards de status
        Object.keys(STATUS_MAP).forEach(statusKey => {
            const count = summary[statusKey] || 0;
            const statusInfo = STATUS_MAP[statusKey];
            const card = `
                <div class="col">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="card-title">${statusInfo.text}</h6>
                            <p class="card-text fs-4">${count.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>`;
            $notesSummaryCardsContainer.append(card);
        });
    }

    function updateMaterialCards(notas) {
        const materialSummary = notas.reduce((acc, nota) => {
            const material = nota.material || "Indefinido";
            acc[material] = (acc[material] || 0) + parseFloat(nota.quantidade || 0);
            return acc;
        }, {});

        $materialCardsContainer.empty();
        for (const material in materialSummary) {
            const quantidadeTon = materialSummary[material] / 1000;
            const quantidadeFormatada = quantidadeTon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const card = `
                <div class="col-md-3 mb-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="card-title">${material}</h6>
                            <p class="card-text">${quantidadeFormatada} Ton</p>
                        </div>
                    </div>
                </div>`;
            $materialCardsContainer.append(card);
        }
    }

    function updateNotesTable(notas) {
        if ($.fn.DataTable.isDataTable('#notas-fiscais-table')) {
            notesDataTable.clear().rows.add(notas).draw();
        } else {
            notesDataTable = $('#notas-fiscais-table').DataTable({
                data: notas,
                columns: [
                    { data: 'numero_nota' },
                    { data: 'data_emissao', render: data => new Date(data).toLocaleDateString('pt-BR') },
                    { data: 'material' },
                    { 
                        data: 'quantidade', 
                        render: data => {
                            const quantidadeEmTon = parseFloat(data || 0) / 1000;
                            return quantidadeEmTon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Ton';
                        }
                    },
                    { data: 'status', render: data => `<span class="${STATUS_MAP[data]?.class || 'bg-secondary'}">${STATUS_MAP[data]?.text || data}</span>` },
                    { 
                        data: null, 
                        orderable: false,
                        render: (data, type, row) => `<button class="btn btn-sm btn-info edit-status-btn" data-note-id="${row.id}" data-current-status="${row.status}" data-note-number="${row.numero_nota}">Alterar</button>`
                    }
                ],
                responsive: true,
                language: {
                    "sEmptyTable": "Nenhum registro encontrado",
                    "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
                    "sInfoEmpty": "Mostrando 0 até 0 de 0 registros",
                    "sInfoFiltered": "(Filtrados de _MAX_ registros no total)",
                    "sInfoPostFix": "",
                    "sInfoThousands": ".",
                    "sLengthMenu": "_MENU_ registros por página",
                    "sLoadingRecords": "Carregando...",
                    "sProcessing": "Processando...",
                    "sZeroRecords": "Nenhum registro encontrado",
                    "sSearch": "Pesquisar",
                    "oPaginate": {
                        "sNext": "Próximo",
                        "sPrevious": "Anterior",
                        "sFirst": "Primeiro",
                        "sLast": "Último"
                    },
                    "oAria": {
                        "sSortAscending": ": Ordenar colunas de forma ascendente",
                        "sSortDescending": ": Ordenar colunas de forma descendente"
                    }
                }
            });
        }
    }

    function manageEventListeners(add = true) {
        const action = add ? 'on' : 'off';
        $searchNotesBtn[action]('click', handleSearchClick);
        $limparFiltrosBtn[action]('click', handleClearFilters);
        $saveStatusChangeBtn[action]('click', handleSaveStatusChange);
        $('#notas-fiscais-table tbody')[action]('click', '.edit-status-btn', function() {
            const button = this;
            $editNoteId.val(button.dataset.noteId);
            $modalNoteNumber.text(button.dataset.noteNumber);
            $editCurrentStatus.val(button.dataset.currentStatus);
            $editNewStatus.val('');
            editStatusModal.show();
        });
        // Adiciona listener para o filtro de ano
        if (add) {
            $yearFilter.on('change', handleSearchClick);
        } else {
            $yearFilter.off('change', handleSearchClick);
        }
    }

    // --- Inicialização e Limpeza ---
    manageEventListeners(true);
    initPage(); // Inicia o carregamento dos filtros

    // Retorna a função de limpeza para ser usada pelo main.js
    return function cleanupConsultaNotasCliente() {
        console.log("[Frontend] cleanupConsultaNotasCliente: Limpando módulo...");
        manageEventListeners(false);
        if (notesDataTable) {
            notesDataTable.destroy();
        }
        $filterClientSelect.select2('destroy');
    };
}

// Expõe a função de inicialização para o escopo global
window.initConsultaNotasCliente = initConsultaNotasCliente;

// Adiciona uma função de limpeza no caso de o script ser removido
window.cleanupConsultaNotasCliente = function() {
    // Tenta encontrar a função de limpeza específica da instância e chamá-la
    // Esta parte é um fallback e pode não ser sempre necessária dependendo do fluxo
    if (window.activeCleanupFunction) {
        window.activeCleanupFunction();
        window.activeCleanupFunction = null;
    }
}; 