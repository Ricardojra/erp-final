// frontend/js/relatorio-vendas.js

// Armazena os dados do relatório atual para exportação
let dadosAtuaisRelatorio = [];
let paginaAtual = 1;
let itensPorPagina = 25;
let configuracaoRelatorio = {
    colunasVisiveis: {
        data: true,
        cliente: true,
        material: true,
        quantidade: true,
        valorUnitario: true,
        valorTotal: true,
        unidadeGestora: false
    },
    ordenacao: 'data_desc'
};

// Função de limpeza para remover listeners e evitar vazamentos de memória
window.cleanupRelatorioVendas = () => {
    console.log('Limpando listeners e recursos de relatorio-vendas...');
    
    // Remover todos os event listeners
    const elementos = [
        'btn-gerar-relatorio',
        'btn-exportar-csv',
        'btn-exportar-excel',
        'btn-exportar-pdf',
        'btn-limpar-filtros',
        'btn-salvar-filtros',
        'btn-configurar-relatorio',
        'btn-expandir-todos',
        'btn-colapsar-todos',
        'select-all-vendas',
        'itens-por-pagina',
        'btn-salvar-configuracoes'
    ];
    
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento && elemento.handler) {
            elemento.removeEventListener('click', elemento.handler);
        }
    });
    
    dadosAtuaisRelatorio = [];
    delete window.initRelatorioVendas;
    delete window.cleanupRelatorioVendas;
};

// Função de inicialização, chamada pelo main.js quando a página é carregada
window.initRelatorioVendas = () => {
    console.log('Inicializando listeners para relatorio-vendas...');

    const elementos = {
        btnGerarRelatorio: document.getElementById('btn-gerar-relatorio'),
        btnExportarCsv: document.getElementById('btn-exportar-csv'),
        btnExportarExcel: document.getElementById('btn-exportar-excel'),
        btnExportarPdf: document.getElementById('btn-exportar-pdf'),
        btnLimparFiltros: document.getElementById('btn-limpar-filtros'),
        btnSalvarFiltros: document.getElementById('btn-salvar-filtros'),
        btnConfigurarRelatorio: document.getElementById('btn-configurar-relatorio'),
        btnExpandirTodos: document.getElementById('btn-expandir-todos'),
        btnColapsarTodos: document.getElementById('btn-colapsar-todos'),
        selectAllVendas: document.getElementById('select-all-vendas'),
        itensPorPagina: document.getElementById('itens-por-pagina'),
        btnSalvarConfiguracoes: document.getElementById('btn-salvar-configuracoes'),
        filtroCliente: document.getElementById('filtro-cliente-relatorio'),
        filtroMaterial: document.getElementById('filtro-material-relatorio'),
        filtroUnidadeGestora: document.getElementById('filtro-unidade-gestora'),
        filtroStatusVenda: document.getElementById('filtro-status-venda'),
        tabelaCorpo: document.getElementById('tabela-relatorio-vendas-corpo'),
        totalQuantidade: document.getElementById('total-quantidade'),
        totalValor: document.getElementById('total-valor'),
        resumoValorTotal: document.getElementById('resumo-valor-total'),
        resumoTotalVendas: document.getElementById('resumo-total-vendas'),
        resumoQuantidadeTotal: document.getElementById('resumo-quantidade-total'),
        resumoTicketMedio: document.getElementById('resumo-ticket-medio'),
        paginacao: document.getElementById('paginacao')
    };

    const formatCurrency = (value) => {
        return parseFloat(value || 0).toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatNumber = (value) => {
        return parseFloat(value || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const carregarFiltros = async () => {
        try {
            // Carregar Clientes
            const resClientes = await fetch('/api/clientes');
            const dataClientes = await resClientes.json();
            if (dataClientes.success) {
                elementos.filtroCliente.innerHTML = '<option value="">Todos os Clientes</option>';
                dataClientes.clients.forEach(c => {
                    elementos.filtroCliente.appendChild(new Option(c.razao_social, c.id));
                });
            }

            // Carregar Materiais
            const resMateriais = await fetch('/api/vendas/materiais/disponiveis');
            const dataMateriais = await resMateriais.json();
            if (dataMateriais.success) {
                elementos.filtroMaterial.innerHTML = '<option value="">Todos os Materiais</option>';
                dataMateriais.materiais.forEach(m => {
                    elementos.filtroMaterial.appendChild(new Option(m.nome, m.nome));
                });
            }

            // Carregar Unidades Gestoras
            const resUnidades = await fetch('/api/vendas/unidades-gestoras');
            const dataUnidades = await resUnidades.json();
            if (dataUnidades.success) {
                elementos.filtroUnidadeGestora.innerHTML = '<option value="">Todas as Unidades</option>';
                dataUnidades.unidades.forEach(u => {
                    elementos.filtroUnidadeGestora.appendChild(new Option(u.unidade_gestora, u.unidade_gestora));
                });
            }
        } catch (error) {
            console.error('Erro ao carregar filtros:', error);
        }
    };

    const gerarRelatorio = async () => {
        const filtros = {
            dataInicio: document.getElementById('filtro-data-inicio').value,
            dataFim: document.getElementById('filtro-data-fim').value,
            clienteId: elementos.filtroCliente.value,
            material: elementos.filtroMaterial.value,
            unidadeGestora: elementos.filtroUnidadeGestora.value,
            status: elementos.filtroStatusVenda.value,
            pagina: paginaAtual,
            itensPorPagina: itensPorPagina,
            ordenacao: configuracaoRelatorio.ordenacao
        };

        const url = new URL('/api/vendas/relatorio-detalhado', window.location.origin);
        Object.keys(filtros).forEach(key => {
            if (filtros[key]) url.searchParams.append(key, filtros[key]);
        });

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Falha ao gerar relatório: ${response.statusText}`);
            const dados = await response.json();
            dadosAtuaisRelatorio = dados.success ? dados.itens : [];
            renderizarRelatorio(dadosAtuaisRelatorio);
            atualizarMetricas(dadosAtuaisRelatorio);
            gerarGraficos(dadosAtuaisRelatorio);
            gerarPaginacao(dados.total || dadosAtuaisRelatorio.length);
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            elementos.tabelaCorpo.innerHTML = `<tr><td colspan="9" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    const renderizarRelatorio = (itens) => {
        elementos.tabelaCorpo.innerHTML = '';
        if (itens.length === 0) {
            elementos.tabelaCorpo.innerHTML = '<tr><td colspan="9" class="text-center">Nenhum resultado encontrado.</td></tr>';
            elementos.totalQuantidade.textContent = '0,00';
            elementos.totalValor.textContent = formatCurrency(0);
            return;
        }

        let totalQuantidade = 0;
        let totalValor = 0;

        itens.forEach((item, index) => {
            const valorTotalItem = parseFloat(item.valor_total_item || 0);
            const valorUnitario = parseFloat(item.valor_unitario || 0);
            const quantidade = parseFloat(item.quantidade || 0);
            const quantidadeTon = parseFloat(item.quantidade_ton || 0);
            
            totalQuantidade += quantidadeTon;
            totalValor += valorTotalItem;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input select-venda" data-id="${item.id || index}">
                </td>
                <td>${formatDate(item.data_venda)}</td>
                <td>${item.cliente_nome || 'N/A'}</td>
                <td>${item.material || 'N/A'}</td>
                <td>${formatNumber(quantidadeTon)} Ton</td>
                <td>${formatCurrency(valorUnitario)}</td>
                <td>${formatCurrency(valorTotalItem)}</td>
                <td>${item.unidade_gestora || 'N/A'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-detalhes-venda" data-id="${item.id || index}" title="Ver Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-imprimir-venda" data-id="${item.id || index}" title="Imprimir">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </td>
            `;
            elementos.tabelaCorpo.appendChild(row);
        });

        elementos.totalQuantidade.textContent = `${formatNumber(totalQuantidade)} Ton`;
        elementos.totalValor.textContent = formatCurrency(totalValor);
    };

    const atualizarMetricas = (itens) => {
        const valorTotal = itens.reduce((sum, item) => sum + parseFloat(item.valor_total_item || 0), 0);
        const quantidadeTotal = itens.reduce((sum, item) => sum + parseFloat(item.quantidade_ton || 0), 0);
        const totalVendas = new Set(itens.map(item => item.venda_id)).size;
        const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

        elementos.resumoValorTotal.textContent = formatCurrency(valorTotal);
        elementos.resumoTotalVendas.textContent = totalVendas.toLocaleString('pt-BR');
        elementos.resumoQuantidadeTotal.textContent = `${formatNumber(quantidadeTotal)} Ton`;
        elementos.resumoTicketMedio.textContent = formatCurrency(ticketMedio);
    };

    const gerarGraficos = (itens) => {
        // Gráfico de vendas por período
        const vendasPorPeriodo = {};
        itens.forEach(item => {
            const data = formatDate(item.data_venda);
            vendasPorPeriodo[data] = (vendasPorPeriodo[data] || 0) + parseFloat(item.valor_total_item || 0);
        });

        const ctxPeriodo = document.getElementById('graficoVendasPeriodo');
        if (ctxPeriodo) {
            new Chart(ctxPeriodo, {
                type: 'line',
                data: {
                    labels: Object.keys(vendasPorPeriodo),
                    datasets: [{
                        label: 'Valor Total (R$)',
                        data: Object.values(vendasPorPeriodo),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        }

        // Gráfico de top clientes
        const vendasPorCliente = {};
        itens.forEach(item => {
            vendasPorCliente[item.cliente_nome] = (vendasPorCliente[item.cliente_nome] || 0) + parseFloat(item.valor_total_item || 0);
        });

        const topClientes = Object.entries(vendasPorCliente)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const ctxClientes = document.getElementById('graficoTopClientes');
        if (ctxClientes) {
            new Chart(ctxClientes, {
                type: 'doughnut',
                data: {
                    labels: topClientes.map(([cliente]) => cliente),
                    datasets: [{
                        data: topClientes.map(([, valor]) => valor),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });
        }

        // Gráfico de vendas por material
        const vendasPorMaterial = {};
        itens.forEach(item => {
            vendasPorMaterial[item.material] = (vendasPorMaterial[item.material] || 0) + parseFloat(item.valor_total_item || 0);
        });

        const ctxMaterial = document.getElementById('graficoVendasMaterial');
        if (ctxMaterial) {
            new Chart(ctxMaterial, {
                type: 'bar',
                data: {
                    labels: Object.keys(vendasPorMaterial),
                    datasets: [{
                        label: 'Valor Total (R$)',
                        data: Object.values(vendasPorMaterial),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        }
    };

    const gerarPaginacao = (totalItens) => {
        const totalPaginas = Math.ceil(totalItens / itensPorPagina);
        elementos.paginacao.innerHTML = '';

        if (totalPaginas <= 1) return;

        // Botão Anterior
        const liAnterior = document.createElement('li');
        liAnterior.className = `page-item ${paginaAtual === 1 ? 'disabled' : ''}`;
        liAnterior.innerHTML = `<a class="page-link" href="#" data-pagina="${paginaAtual - 1}">Anterior</a>`;
        elementos.paginacao.appendChild(liAnterior);

        // Páginas numeradas
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= paginaAtual - 2 && i <= paginaAtual + 2)) {
                const li = document.createElement('li');
                li.className = `page-item ${i === paginaAtual ? 'active' : ''}`;
                li.innerHTML = `<a class="page-link" href="#" data-pagina="${i}">${i}</a>`;
                elementos.paginacao.appendChild(li);
            } else if (i === paginaAtual - 3 || i === paginaAtual + 3) {
                const li = document.createElement('li');
                li.className = 'page-item disabled';
                li.innerHTML = '<span class="page-link">...</span>';
                elementos.paginacao.appendChild(li);
            }
        }

        // Botão Próximo
        const liProximo = document.createElement('li');
        liProximo.className = `page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}`;
        liProximo.innerHTML = `<a class="page-link" href="#" data-pagina="${paginaAtual + 1}">Próximo</a>`;
        elementos.paginacao.appendChild(liProximo);
    };

    const exportarParaCSV = () => {
        if (dadosAtuaisRelatorio.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }
        
        const headers = ['Data', 'Cliente', 'Material', 'Quantidade (Ton)', 'Valor Unitário (R$/Ton)', 'Valor Total (R$)', 'Unidade Gestora'];
        const rows = dadosAtuaisRelatorio.map(item => [
            formatDate(item.data_venda),
            `"${item.cliente_nome || 'N/A'}"`,
            item.material || 'N/A',
            formatNumber(item.quantidade_ton || 0),
            formatNumber(item.valor_unitario || 0),
            formatNumber(item.valor_total_item || 0),
            item.unidade_gestora || 'N/A'
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadArquivo(csvContent, 'relatorio_vendas.csv', 'text/csv');
    };

    const exportarParaExcel = () => {
        if (dadosAtuaisRelatorio.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }

        // Implementação básica - em produção usar uma biblioteca como SheetJS
        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Material</th>
                        <th>Quantidade (Ton)</th>
                        <th>Valor Unitário (R$/Ton)</th>
                        <th>Valor Total (R$)</th>
                        <th>Unidade Gestora</th>
                    </tr>
                </thead>
                <tbody>
                    ${dadosAtuaisRelatorio.map(item => `
                        <tr>
                            <td>${formatDate(item.data_venda)}</td>
                            <td>${item.cliente_nome || 'N/A'}</td>
                            <td>${item.material || 'N/A'}</td>
                            <td>${formatNumber(item.quantidade_ton || 0)}</td>
                            <td>${formatNumber(item.valor_unitario || 0)}</td>
                            <td>${formatNumber(item.valor_total_item || 0)}</td>
                            <td>${item.unidade_gestora || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        downloadArquivo(blob, 'relatorio_vendas.xls', 'application/vnd.ms-excel');
    };

    const exportarParaPDF = () => {
        if (dadosAtuaisRelatorio.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }

        // Implementação básica - em produção usar uma biblioteca como jsPDF
        const html = `
            <html>
                <head>
                    <title>Relatório de Vendas</title>
                    <style>
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid black; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Vendas</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Material</th>
                                <th>Quantidade (Ton)</th>
                                <th>Valor Unitário (R$/Ton)</th>
                                <th>Valor Total (R$)</th>
                                <th>Unidade Gestora</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dadosAtuaisRelatorio.map(item => `
                                <tr>
                                    <td>${formatDate(item.data_venda)}</td>
                                    <td>${item.cliente_nome || 'N/A'}</td>
                                    <td>${item.material || 'N/A'}</td>
                                    <td>${formatNumber(item.quantidade_ton || 0)}</td>
                                    <td>${formatNumber(item.valor_unitario || 0)}</td>
                                    <td>${formatNumber(item.valor_total_item || 0)}</td>
                                    <td>${item.unidade_gestora || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'application/pdf' });
        downloadArquivo(blob, 'relatorio_vendas.pdf', 'application/pdf');
    };

    const downloadArquivo = (content, filename, type) => {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const limparFiltros = () => {
        document.getElementById('filtro-data-inicio').value = '';
        document.getElementById('filtro-data-fim').value = '';
        elementos.filtroCliente.value = '';
        elementos.filtroMaterial.value = '';
        elementos.filtroUnidadeGestora.value = '';
        elementos.filtroStatusVenda.value = '';
        gerarRelatorio();
    };

    const salvarFiltros = () => {
        const filtros = {
            dataInicio: document.getElementById('filtro-data-inicio').value,
            dataFim: document.getElementById('filtro-data-fim').value,
            clienteId: elementos.filtroCliente.value,
            material: elementos.filtroMaterial.value,
            unidadeGestora: elementos.filtroUnidadeGestora.value,
            status: elementos.filtroStatusVenda.value
        };
        
        localStorage.setItem('filtrosRelatorioVendas', JSON.stringify(filtros));
        alert('Filtros salvos com sucesso!');
    };

    const carregarFiltrosSalvos = () => {
        const filtrosSalvos = localStorage.getItem('filtrosRelatorioVendas');
        if (filtrosSalvos) {
            const filtros = JSON.parse(filtrosSalvos);
            document.getElementById('filtro-data-inicio').value = filtros.dataInicio || '';
            document.getElementById('filtro-data-fim').value = filtros.dataFim || '';
            elementos.filtroCliente.value = filtros.clienteId || '';
            elementos.filtroMaterial.value = filtros.material || '';
            elementos.filtroUnidadeGestora.value = filtros.unidadeGestora || '';
            elementos.filtroStatusVenda.value = filtros.status || '';
        }
    };

    const mostrarDetalhesVenda = async (vendaId) => {
        try {
            const response = await fetch(`/api/vendas/detalhes/${vendaId}`);
            const dados = await response.json();
            
            if (dados.success) {
                const modal = new bootstrap.Modal(document.getElementById('modalDetalhesVenda'));
                const modalBody = document.getElementById('modalDetalhesVendaCorpo');
                
                modalBody.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Informações da Venda</h6>
                            <p><strong>Cliente:</strong> ${dados.venda.cliente_nome}</p>
                            <p><strong>Data:</strong> ${dados.venda.data_venda_formatada}</p>
                            <p><strong>Valor Total:</strong> ${formatCurrency(dados.venda.valor_total)}</p>
                            <p><strong>Unidade Gestora:</strong> ${dados.venda.unidade_gestora}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Resumo</h6>
                            <p><strong>Total de Itens:</strong> ${dados.totais.total_itens}</p>
                            <p><strong>Quantidade Total:</strong> ${formatNumber(dados.totais.total_quantidade)} Ton</p>
                            <p><strong>Valor Total:</strong> ${formatCurrency(dados.totais.total_valor)}</p>
                        </div>
                    </div>
                    <hr>
                    <h6>Itens da Venda</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Material</th>
                                    <th>Quantidade</th>
                                    <th>Valor Unitário</th>
                                    <th>Valor Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dados.itens.map(item => `
                                    <tr>
                                        <td>${item.material}</td>
                                        <td>${formatNumber(item.quantidade_ton || 0)} Ton</td>
                                        <td>${formatCurrency(item.valor_unitario || 0)}</td>
                                        <td>${formatCurrency(item.valor_total_item || 0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                modal.show();
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes da venda:', error);
            alert('Erro ao carregar detalhes da venda.');
        }
    };

    // Event Listeners
    elementos.btnGerarRelatorio.handler = gerarRelatorio;
    elementos.btnGerarRelatorio.addEventListener('click', gerarRelatorio);
    
    elementos.btnExportarCsv.handler = exportarParaCSV;
    elementos.btnExportarCsv.addEventListener('click', exportarParaCSV);
    
    elementos.btnExportarExcel.handler = exportarParaExcel;
    elementos.btnExportarExcel.addEventListener('click', exportarParaExcel);
    
    elementos.btnExportarPdf.handler = exportarParaPDF;
    elementos.btnExportarPdf.addEventListener('click', exportarParaPDF);
    
    elementos.btnLimparFiltros.handler = limparFiltros;
    elementos.btnLimparFiltros.addEventListener('click', limparFiltros);
    
    elementos.btnSalvarFiltros.handler = salvarFiltros;
    elementos.btnSalvarFiltros.addEventListener('click', salvarFiltros);
    
    elementos.btnConfigurarRelatorio.handler = () => {
        const modal = new bootstrap.Modal(document.getElementById('modalConfigurarRelatorio'));
        modal.show();
    };
    elementos.btnConfigurarRelatorio.addEventListener('click', elementos.btnConfigurarRelatorio.handler);

    elementos.btnSalvarConfiguracoes.handler = () => {
        // Salvar configurações
        configuracaoRelatorio.colunasVisiveis.data = document.getElementById('col-data').checked;
        configuracaoRelatorio.colunasVisiveis.cliente = document.getElementById('col-cliente').checked;
        configuracaoRelatorio.colunasVisiveis.material = document.getElementById('col-material').checked;
        configuracaoRelatorio.colunasVisiveis.quantidade = document.getElementById('col-quantidade').checked;
        configuracaoRelatorio.colunasVisiveis.valorUnitario = document.getElementById('col-valor-unitario').checked;
        configuracaoRelatorio.colunasVisiveis.valorTotal = document.getElementById('col-valor-total').checked;
        configuracaoRelatorio.colunasVisiveis.unidadeGestora = document.getElementById('col-unidade-gestora').checked;
        
        configuracaoRelatorio.ordenacao = document.getElementById('ordenacao-padrao').value;
        
        localStorage.setItem('configuracaoRelatorioVendas', JSON.stringify(configuracaoRelatorio));
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfigurarRelatorio'));
        modal.hide();
        
        gerarRelatorio();
    };
    elementos.btnSalvarConfiguracoes.addEventListener('click', elementos.btnSalvarConfiguracoes.handler);

    // Event listeners para paginação
    elementos.paginacao.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('page-link')) {
            const novaPagina = parseInt(e.target.dataset.pagina);
            if (novaPagina && novaPagina !== paginaAtual) {
                paginaAtual = novaPagina;
                gerarRelatorio();
            }
        }
    });

    // Event listener para itens por página
    elementos.itensPorPagina.handler = (e) => {
        itensPorPagina = parseInt(e.target.value);
        paginaAtual = 1;
        gerarRelatorio();
    };
    elementos.itensPorPagina.addEventListener('change', elementos.itensPorPagina.handler);

    // Event listener para select all
    elementos.selectAllVendas.handler = (e) => {
        const checkboxes = document.querySelectorAll('.select-venda');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
    };
    elementos.selectAllVendas.addEventListener('change', elementos.selectAllVendas.handler);

    // Event listeners para detalhes de venda
    elementos.tabelaCorpo.addEventListener('click', (e) => {
        if (e.target.closest('.btn-detalhes-venda')) {
            const vendaId = e.target.closest('.btn-detalhes-venda').dataset.id;
            mostrarDetalhesVenda(vendaId);
        }
    });

    // Carregar configurações salvas
    const configSalva = localStorage.getItem('configuracaoRelatorioVendas');
    if (configSalva) {
        configuracaoRelatorio = { ...configuracaoRelatorio, ...JSON.parse(configSalva) };
    }

    // Carregar filtros salvos
    carregarFiltrosSalvos();

    // Inicializar
    carregarFiltros();
    gerarRelatorio();

    console.log('Listeners para relatorio-vendas adicionados com sucesso.');
};
