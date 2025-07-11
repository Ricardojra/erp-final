console.log("[Frontend] cliente-detalhes.js: Script loaded.");

(function () {
    // --- UTILITIES E CONFIGURAÇÕES ---
    const API_BASE_URL = "http://localhost:3000/api";

    function showFeedback(message, type = 'info', container = '#cliente-info-card .card-body') {
        const feedbackElement = $(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`);
        $(container).prepend(feedbackElement);
    }

    function toggleLoading(show, overlayId = '#detail-loading-overlay') {
        $(overlayId).toggleClass('active', show);
    }
    
    function formatCnpj(cnpj) {
      return cnpj ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : "N/A";
    }

    function formatPhone(phone) {
      if (!phone) return "N/A";
      const cleaned = String(phone).replace(/\D/g, "");
      if (cleaned.length === 11) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
      }
      return phone;
    }

    // --- ELEMENTOS DA UI ---
    const backToListBtn = $('#back-to-list-btn');
    const clientDetailsContent = $('#client-details-content');
    const notesTable = $('#notes-table');
    const materialCardsContainer = $('#material-cards-container');

    // --- FUNÇÕES DE LÓGICA ---

    async function fetchClientDetails(clientId) {
        toggleLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/clientes/${clientId}`);
            if (!response.ok) {
                throw new Error(`Erro ao buscar detalhes do cliente: ${response.statusText}`);
            }
            const data = await response.json();
            // A rota /api/clientes/:id retorna um objeto diretamente, não um array
            const client = data.client;
            if (!client) {
                 throw new Error(`Cliente com ID ${clientId} não encontrado.`);
            }
            populateClientDetails(client);
            // Após carregar os detalhes, busca as notas fiscais
            await fetchClientNotes(client.razao_social); // Usando razao_social como o nome do cliente
        } catch (error) {
            console.error("Erro no fetchClientDetails:", error);
            showFeedback(`Não foi possível carregar os detalhes do cliente. ${error.message}`, 'danger');
        } finally {
            toggleLoading(false);
        }
    }

    function populateClientDetails(client) {
        $('#detail-cnpj').text(formatCnpj(client.cnpj));
        $('#detail-razao-social').text(client.razao_social || 'N/A');
        $('#detail-nome-fantasia').text(client.nome_fantasia || 'N/A');
        $('#detail-endereco').text(client.endereco || 'N/A');
        $('#detail-cidade-uf').text(`${client.cidade || 'N/A'}/${client.uf || 'N/A'}`);
        $('#detail-email-contato').text(client.email_contato || 'N/A').attr('href', `mailto:${client.email_contato}`);
        $('#detail-telefone-contato').text(formatPhone(client.telefone_contato));
        $('#detail-ativo').html(client.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-danger">Inativo</span>');
    }

    async function fetchClientNotes(clientName) {
        try {
            // O endpoint espera o nome do cliente, que precisa ser codificado para a URL
            const encodedClientName = encodeURIComponent(clientName);
            const response = await fetch(`${API_BASE_URL}/notas-fiscais/cliente/${encodedClientName}`);
            if (!response.ok) {
                throw new Error(`Erro ao buscar notas fiscais: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.success) {
                updateMaterialCards(result.notas);
                renderNotesTable(result.notas);
            } else {
                throw new Error(result.message || 'Falha ao buscar notas.');
            }
        } catch (error) {
            console.error("Erro no fetchClientNotes:", error);
            showFeedback(`Não foi possível carregar as notas fiscais. ${error.message}`, 'danger', '#notes-table-container');
        }
    }

    function renderNotesTable(notas) {
        if ($.fn.DataTable.isDataTable(notesTable)) {
            notesTable.DataTable().destroy();
        }

        notesTable.DataTable({
            data: notas,
            columns: [
                { data: 'numero_nota', title: 'Nº da Nota' },
                { 
                    data: 'data_emissao', title: 'Data de Emissão',
                    render: function(data) {
                        return new Date(data).toLocaleDateString('pt-BR');
                    }
                },
                { data: 'material', title: 'Material' },
                { data: 'quantidade', title: 'Quantidade (Kg)' },
                { 
                    data: 'valor', title: 'Valor (R$)',
                    render: function(data) {
                        return parseFloat(data).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    } 
                },
                { data: 'status', title: 'Status',
                    render: function(data) {
                         const statusInfo = {
                            disponivel: { text: "Disponível", class: "badge bg-success" },
                            enviada: { text: "Enviada", class: "badge bg-primary" },
                            vendida: { text: "Vendida", class: "badge bg-info text-dark" },
                            reprovada: { text: "Reprovada", class: "badge bg-danger" },
                            pendente: { text: "Pendente", class: "badge bg-warning text-dark" },
                        };
                        const status = statusInfo[data] || { text: data, class: "badge bg-secondary" };
                        return `<span class="${status.class}">${status.text}</span>`;
                    }
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
            },
            order: [[1, 'desc']] // Ordenar por data de emissão descendente
        });
    }

    function updateMaterialCards(notas) {
        const materialSummary = notas.reduce((acc, nota) => {
            if (nota.material && nota.quantidade) {
                if (!acc[nota.material]) {
                    acc[nota.material] = 0;
                }
                acc[nota.material] += parseFloat(nota.quantidade);
            }
            return acc;
        }, {});

        materialCardsContainer.empty();
        if (Object.keys(materialSummary).length === 0) {
            materialCardsContainer.append('<div class="col"><p>Nenhum material encontrado para este cliente.</p></div>');
            return;
        }

        for (const material in materialSummary) {
            const card = `
                <div class="col-md-3 mb-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="card-title">${material}</h6>
                            <p class="card-text">${(materialSummary[material] / 1000).toFixed(3)} Ton.</p>
                        </div>
                    </div>
                </div>`;
            materialCardsContainer.append(card);
        }
    }


    // --- INICIALIZAÇÃO ---

    function init() {
        // Extrai o ID do cliente da URL (ex: #/cliente-detalhes?id=123)
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const clientId = params.get('id');

        if (clientId) {
            fetchClientDetails(clientId);
        } else {
            console.error("ID do cliente não encontrado na URL.");
            showFeedback("ID do cliente não fornecido na URL. Não é possível carregar os detalhes.", 'danger');
        }

        // Event listener para o botão de voltar
        backToListBtn.on('click', () => {
            window.location.hash = '#/lista-clientes';
        });
    }

    // Inicializa o script
    init();

})(); 