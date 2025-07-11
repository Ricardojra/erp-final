// Variáveis de escopo do módulo para manter o estado
let materialChart = null;
let isInitialized = false;
const eventListeners = []; // Array para rastrear os event listeners

/**
 * Inicializa o dashboard de materiais.
 */
async function initDashboardMaterial() {
    if (isInitialized) {
        console.log("Dashboard de materiais já inicializado.");
        return;
    }
    console.log("Inicializando o dashboard de materiais...");

    // Elementos da interface
    const refreshBtn = document.getElementById("refresh-btn");
    const materialSummaryChartCanvas = document.getElementById("materialSummaryChart");
    const container = document.querySelector("#content .container-fluid") || document.body;

    // Verificação de dependências
    if (typeof bootstrap === "undefined" || typeof Chart === "undefined") {
        showError("Dependências (Bootstrap, Chart.js) não foram carregadas corretamente.");
        return;
    }

    // Configurações
    const API_BASE_URL = window.env?.API_URL || "http://localhost:3000";
    const MATERIAIS = {
        vidro: { nome: "Vidro", icon: "fa-wine-bottle", color: "text-vidro" },
        plastico: { nome: "Plástico", icon: "fa-shopping-bag", color: "text-plastico" },
        metal: { nome: "Metal", icon: "fa-tools", color: "text-metal" },
        papel: { nome: "Papel", icon: "fa-file-alt", color: "text-papel" },
        papelao: { nome: "Papelão", icon: "fa-cubes", color: "text-papelao" },
    };
    const STATUS = {
        disponivel: { nome: "Disponível", color: "#28a745" }, // Verde (Sucesso)
        enviada: { nome: "Enviada", color: "#17a2b8" },    // Azul (Informação)
        vendida: { nome: "Vendida", color: "#007bff" },    // Azul mais escuro (Primário)
        reprovada: { nome: "Reprovada", color: "#dc3545" }, // Vermelho (Perigo)
        pendente: { nome: "Pendente", color: "#ffc107" },  // Amarelo (Aviso)
        ofertada: { nome: "Ofertada", color: "#6f42c1" },  // Roxo customizado
    };
    const STATUS_NOTAS = {
        disponivel: { id: "contador-disponiveis-dash" },
        enviada: { id: "contador-enviadas-dash" },
        vendida: { id: "contador-vendidas-dash" },
        reprovada: { id: "contador-reprovadas-dash" },
        pendente: { id: "contador-pendente-dash" },
        ofertada: { id: "contador-ofertada-dash" },
    };

    // Funções auxiliares
    const formatToneladas = (kg) => (kg / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) + " t";

    function showError(message) {
        const alert = document.createElement("div");
        alert.className = "alert alert-danger alert-dismissible fade show";
        alert.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        container.prepend(alert);
    }

    function showLoading(show) {
        const cards = document.querySelectorAll(".material-card .card");
        const icon = refreshBtn?.querySelector("i");
        cards.forEach(card => {
            if (show) {
                card.classList.add("opacity-50");
                if (!card.querySelector('.spinner-border')) {
                    card.insertAdjacentHTML("beforeend", `<div class="position-absolute top-50 start-50 translate-middle"><div class="spinner-border text-primary" role="status"></div></div>`);
                }
            } else {
                card.classList.remove("opacity-50");
                card.querySelector(".spinner-border")?.parentElement.remove();
            }
        });
        if (icon) show ? icon.classList.add("fa-spin") : icon.classList.remove("fa-spin");
    }

    async function fetchStatusCounts() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notas-fiscais/status-counts`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const responseData = await response.json();
            // A resposta da API é { success: true, counts: { ... } }
            // Precisamos passar o objeto aninhado 'counts' para a função.
            if (responseData.success && responseData.counts) {
                populateStatusCards(responseData.counts);
            } else {
                throw new Error('Dados de contagem de status inválidos recebidos da API.');
            }
        } catch (error) {
            console.error("Erro ao buscar contagem de status:", error);
        }
    }

    function populateStatusCards(counts) {
        for (const [status, config] of Object.entries(STATUS_NOTAS)) {
            const element = document.getElementById(config.id);
            if (element) element.textContent = counts[status] || 0;
        }
    }

    function updateCards(data) {
        for (const [key, material] of Object.entries(MATERIAIS)) {
            // Acessa os dados da API usando a chave normalizada do objeto MATERIAIS (ex: 'plastico', 'papelao').
            // Isso corrige o bug onde as chaves 'plásticos' e 'papelão' não eram encontradas.
            const materialData = data[key] || {};
            const total = materialData.total || 0;

            // Atualiza o contador total para o material.
            const totalElement = document.getElementById(`contador-${key}-total`);
            if (totalElement) totalElement.textContent = formatToneladas(total);

            // Atualiza a barra de progresso total (se houver uma).
            const progressTotalElement = document.getElementById(`progress-${key}-total`);
            if (progressTotalElement) progressTotalElement.style.width = "100%";

            // Itera sobre cada status para atualizar os contadores e as barras de progresso individuais.
            for (const status of Object.keys(STATUS)) {
                const value = materialData[status] || 0;
                const percentage = total > 0 ? (value / total) * 100 : 0;

                const statusElement = document.getElementById(`contador-${key}-${status}`);
                if (statusElement) statusElement.textContent = formatToneladas(value);

                const percentageElement = document.getElementById(`percentage-${key}-${status}`);
                if (percentageElement) percentageElement.textContent = `(${percentage.toFixed(1)}%)`;
                
                const progressElement = document.getElementById(`progress-${key}-${status}`);
                if (progressElement) progressElement.style.width = `${percentage}%`;
            }
        }
    }

    function updateChart(data, filter = "all") {
        if (!materialSummaryChartCanvas) return;
        try {
            const ctx = materialSummaryChartCanvas.getContext("2d");
            const isFiltered = filter !== "all";
            const labels = Object.values(MATERIAIS).map(m => m.nome);
            const datasets = isFiltered
                ? [{
                    label: STATUS[filter].nome,
                    data: Object.keys(MATERIAIS).map(key => {
                        const apiKey = key === "papelao" ? "papelão" : key === "plastico" ? "plásticos" : key;
                        return (Number(data[apiKey]?.[filter]) || 0) / 1000;
                    }),
                    backgroundColor: `hsl(${Object.keys(STATUS).indexOf(filter) * 72}, 70%, 50%)`,
                }]
                : Object.entries(STATUS).map(([key, status]) => ({
                    label: status.nome,
                    data: Object.keys(MATERIAIS).map(materialKey => {
                        const apiKey = materialKey === "papelao" ? "papelão" : materialKey === "plastico" ? "plásticos" : materialKey;
                        return (Number(data[apiKey]?.[key]) || 0) / 1000;
                    }),
                    backgroundColor: status.color,
                }));

            if (materialChart) materialChart.destroy();
            materialChart = new Chart(ctx, {
                type: "bar",
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, title: { display: true, text: "Toneladas (t)" }, stacked: !isFiltered }, x: { stacked: !isFiltered } },
                    plugins: { tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatToneladas(ctx.raw * 1000)}` } } },
                },
            });
        } catch (error) {
            console.error("Erro no gráfico:", error);
            showError("Erro ao renderizar o gráfico.");
        }
    }

    async function loadData(filter = "all") {
        showLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/notas-fiscais/materiais-por-status?filter=${filter}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            updateCards(data);
            updateChart(data, filter);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            showError(`Falha ao carregar dados: ${error.message}`);
        } finally {
            showLoading(false);
        }
    }

    function addListener(element, type, handler) {
        element.addEventListener(type, handler);
        eventListeners.push({ element, type, handler });
    }

    function setupEvents() {
        if (refreshBtn) {
            addListener(refreshBtn, "click", () => {
                const activeFilter = document.querySelector(".dropdown-item.active")?.dataset.filter || "all";
                loadData(activeFilter);
                fetchStatusCounts();
            });
        }

        document.querySelectorAll(".dropdown-item[data-filter]").forEach(item => {
            addListener(item, "click", (e) => {
                e.preventDefault();
                document.querySelectorAll(".dropdown-item[data-filter]").forEach(i => i.classList.remove("active"));
                e.target.classList.add("active");
                loadData(e.target.dataset.filter);
            });
        });

        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
    }

    // Inicialização
    try {
        setupEvents();
        await Promise.all([loadData(), fetchStatusCounts()]);
        isInitialized = true;
    } catch (error) {
        console.error("Erro na inicialização:", error);
        showError("Falha ao iniciar dashboard.");
        isInitialized = false; // Garante que não seja considerado inicializado em caso de erro
    }
}

/**
 * Limpa recursos do dashboard de materiais para evitar vazamentos de memória.
 */
function cleanupDashboardMaterial() {
    if (!isInitialized) return;
    console.log("Limpando o dashboard de materiais...");

    // Destruir o gráfico Chart.js
    if (materialChart) {
        materialChart.destroy();
        materialChart = null;
    }

    // Remover event listeners
    eventListeners.forEach(({ element, type, handler }) => {
        if (element) {
            element.removeEventListener(type, handler);
        }
    });
    eventListeners.length = 0; // Limpa o array

    // Limpar tooltips do Bootstrap
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        const tooltip = bootstrap.Tooltip.getInstance(el);
        if (tooltip) {
            tooltip.dispose();
        }
    });

    isInitialized = false;
    console.log("Dashboard de materiais limpo.");
}

// Expõe as funções para o escopo global para que o main.js possa chamá-las
window.initDashboardMaterial = initDashboardMaterial;
window.cleanupDashboardMaterial = cleanupDashboardMaterial;
