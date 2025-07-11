// Define a função de limpeza no escopo global para que possa ser chamada pelo main.js
window.cleanupHistoricoVendas = () => {
    console.log('Limpando listeners e recursos de historico-vendas...');
    const btnFiltrar = document.getElementById('btn-filtrar');
    if (btnFiltrar && btnFiltrar.handler) {
        btnFiltrar.removeEventListener('click', btnFiltrar.handler);
    }
    
    const tabela = document.getElementById('tabela-historico-vendas');
    if (tabela && tabela.handler) {
        tabela.removeEventListener('click', tabela.handler);
    }

    const btnExportar = document.getElementById('btn-exportar');
    if (btnExportar && btnExportar.handler) {
        btnExportar.removeEventListener('click', btnExportar.handler);
    }
    
    // Limpa as funções globais para evitar vazamentos de memória
    delete window.initHistoricoVendas;
    delete window.cleanupHistoricoVendas;
};

// Define a função de inicialização no escopo global
window.initHistoricoVendas = () => {
    console.log('Inicializando listeners para historico-vendas...');
    
    const tabelaHistorico = document.getElementById('tabela-historico-vendas');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnExportar = document.getElementById('btn-exportar');

    // Armazenar os dados carregados para exportação
    let vendasData = [];

    if (!tabelaHistorico || !btnFiltrar || !btnExportar) {
        console.error('[historico-vendas.js] Elementos essenciais não encontrados no DOM.');
        return;
    }

    const carregarHistoricoVendas = async (filtros = {}) => {
        const query = new URLSearchParams(filtros).toString();
        try {
            const response = await fetch(`/api/vendas?${query}`);
            if (!response.ok) throw new Error('Erro ao buscar histórico de vendas.');
            const vendas = await response.json();
            vendasData = vendas; // Armazena os dados para exportação
            renderTabela(vendas);
        } catch (error) {
            console.error('[historico-vendas.js] Erro:', error);
            tabelaHistorico.innerHTML = '<tr><td colspan="9" class="text-center">Erro ao carregar o histórico.</td></tr>';
        }
    };

    const renderTabela = (vendas) => {
        tabelaHistorico.innerHTML = '';
        if (vendas.length === 0) {
            tabelaHistorico.innerHTML = '<tr><td colspan="9" class="text-center">Nenhuma venda encontrada.</td></tr>';
            return;
        }
        vendas.forEach(venda => {
            const dataVenda = new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const valorTotal = parseFloat(venda.valor_total_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            // Calcular quantidade total em toneladas e valor por tonelada
            const quantidadeTotalTon = parseFloat(venda.quantidade_total_ton || 0);
            const valorPorTonelada = quantidadeTotalTon > 0 ? parseFloat(venda.valor_total_venda) / quantidadeTotalTon : 0;
            const valorPorToneladaFormatado = valorPorTonelada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const row = `
                <tr>
                    <td>${venda.id}</td>
                    <td>${venda.cliente_comprador_nome}</td>
                    <td>${venda.numero_pedido_compra}</td>
                    <td>${dataVenda}</td>
                    <td>${quantidadeTotalTon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${valorPorToneladaFormatado}</td>
                    <td>${valorTotal}</td>
                    <td>${venda.unidade_gestora_venda}</td>
                    <td><button class="btn btn-sm btn-info btn-detalhes-venda" data-id="${venda.id}">Detalhes</button></td>
                </tr>`;
            tabelaHistorico.innerHTML += row;
        });
    };

    const handleTableClick = async (event) => {
        if (event.target.classList.contains('btn-detalhes-venda')) {
            const vendaId = event.target.dataset.id;
            console.log(`Buscar detalhes para a venda ID: ${vendaId}`);
            
            // Mostrar loading
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
            btn.disabled = true;
            
            try {
                const response = await fetch(`/api/vendas/detalhes/${vendaId}`);
                let data = null;
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error('[historico-vendas.js] Erro ao converter resposta para JSON:', jsonError);
                    alert('Erro inesperado ao processar resposta do servidor.');
                    return;
                }
                if (!response.ok) {
                    // Mensagem customizada para venda não encontrada
                    if (response.status === 404 && data && data.message) {
                        alert('Venda não encontrada: ' + data.message);
                    } else if (data && data.message) {
                        alert('Erro: ' + data.message);
                    } else {
                        alert('Erro desconhecido ao buscar detalhes da venda.');
                    }
                    console.error('[historico-vendas.js] Erro HTTP:', response.status, data);
                    return;
                }
                if (data.success) {
                    mostrarDetalhesVenda(data);
                } else {
                    alert('Erro: ' + (data.message || 'Não foi possível obter os detalhes da venda.'));
                    console.error('[historico-vendas.js] Resposta inesperada:', data);
                }
            } catch (error) {
                console.error('[historico-vendas.js] Erro ao buscar detalhes:', error);
                alert('Erro de conexão ao buscar detalhes da venda. Verifique sua conexão ou tente novamente.');
            } finally {
                // Restaurar botão
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    };

    const mostrarDetalhesVenda = (data) => {
        const modal = new bootstrap.Modal(document.getElementById('modal-detalhes-venda'));
        const modalBody = document.querySelector('#modal-detalhes-venda .modal-body');
        const modalTitle = document.querySelector('#modal-detalhes-venda .modal-title');
        
        // Atualizar título do modal
        modalTitle.innerHTML = `<i class="fas fa-receipt"></i> Detalhes da Venda #${data.venda.id}`;
        
        const formatCurrency = (value) => parseFloat(value || 0).toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        });
        
        const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');
        
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold">Informações da Venda</h6>
                    <table class="table table-sm">
                        <tr><td><strong>ID:</strong></td><td>${data.venda.id}</td></tr>
                        <tr><td><strong>Cliente:</strong></td><td>${data.venda.cliente_nome}</td></tr>
                        <tr><td><strong>Documento:</strong></td><td>${data.venda.cliente_documento || 'N/A'}</td></tr>
                        <tr><td><strong>Pedido de Compra:</strong></td><td>${data.venda.numero_pedido_compra || 'N/A'}</td></tr>
                        <tr><td><strong>Data da Venda:</strong></td><td>${data.venda.data_venda_formatada}</td></tr>
                        <tr><td><strong>Unidade Gestora:</strong></td><td>${data.venda.unidade_gestora || 'N/A'}</td></tr>
                        <tr><td><strong>Valor Total:</strong></td><td>${formatCurrency(data.venda.valor_total)}</td></tr>
                        <tr><td><strong>NF Serviço:</strong></td><td>${data.venda.numero_nf_servico || 'N/A'}</td></tr>
                        <tr><td><strong>Cliente Final:</strong></td><td>${data.venda.cliente_final || 'N/A'}</td></tr>
                        <tr><td><strong>Observações:</strong></td><td>${data.venda.observacoes || 'N/A'}</td></tr>
                        <tr><td><strong>Data Registro:</strong></td><td>${data.venda.data_registro_formatada}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold">Resumo</h6>
                    <div class="card">
                        <div class="card-body">
                            <p><strong>Total de Itens:</strong> ${data.totais.total_itens}</p>
                            <p><strong>Quantidade Total:</strong> ${data.totais.total_quantidade.toFixed(2).replace('.', ',')} Ton</p>
                            <p><strong>Valor Total:</strong> ${formatCurrency(data.totais.total_valor)}</p>
                            <p><strong>Valor por Tonelada:</strong> R$ ${data.venda.valor_por_tonelada ? parseFloat(data.venda.valor_por_tonelada).toFixed(2).replace('.', ',') : '0,00'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (data.itens_por_material && data.itens_por_material.length > 0) {
            html += `
                <div class="mt-4">
                    <h6 class="fw-bold">Itens por Material</h6>
                    <div class="accordion" id="accordion-materiais">
            `;
            
            data.itens_por_material.forEach((grupo, index) => {
                html += `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading-${index}">
                            <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${index}">
                                ${grupo.material} - ${grupo.quantidade.toFixed(2).replace('.', ',')} Ton - R$ ${grupo.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </button>
                        </h2>
                        <div id="collapse-${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#accordion-materiais">
                            <div class="accordion-body">
                                <div class="table-responsive">
                                    <table class="table table-sm table-striped">
                                        <thead>
                                            <tr>
                                                <th>Descrição</th>
                                                <th>Quantidade</th>
                                                <th>Valor Unitário</th>
                                                <th>Valor Total</th>
                                                <th>Nota Fiscal</th>
                                                <th>Emitente</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                `;
                
                grupo.itens.forEach(item => {
                    const quantidadeTon = Number(item.quantidade_ton) || 0;
                    html += `
                        <tr>
                            <td>${item.descricao}</td>
                            <td>${quantidadeTon.toFixed(2).replace('.', ',')} Ton</td>
                            <td>R$ ${item.valor_unitario.toFixed(2).replace('.', ',')}</td>
                            <td>R$ ${item.valor_total_item.toFixed(2).replace('.', ',')}</td>
                            <td>${item.numero_nota}</td>
                            <td>${item.emitente_nome}</td>
                        </tr>
                    `;
                });
                
                html += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="mt-4">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> Nenhum item encontrado para esta venda.
                    </div>
                </div>
            `;
        }
        
        modalBody.innerHTML = html;
        modal.show();
        
        // Adicionar listener para exportação
        const btnExportar = document.getElementById('btn-exportar-detalhes');
        if (btnExportar) {
            btnExportar.onclick = () => exportarDetalhesVenda(data);
        }
    };

    const exportarDetalhesVenda = (data) => {
        const formatCurrency = (value) => parseFloat(value || 0).toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        });
        
        let csvContent = 'Venda ID,Cliente,Documento,Pedido Compra,Data Venda,Unidade Gestora,Valor Total,NF Serviço,Cliente Final,Observações\n';
        csvContent += `${data.venda.id},"${data.venda.cliente_nome}","${data.venda.cliente_documento || ''}","${data.venda.numero_pedido_compra || ''}","${data.venda.data_venda_formatada}","${data.venda.unidade_gestora || ''}","${formatCurrency(data.venda.valor_total)}","${data.venda.numero_nf_servico || ''}","${data.venda.cliente_final || ''}","${data.venda.observacoes || ''}"\n\n`;
        
        csvContent += 'Material,Descrição,Quantidade,Unidade,Valor Unitário,Valor Total,Nota Fiscal,Emitente\n';
        
        data.itens.forEach(item => {
            csvContent += `"${item.material}","${item.descricao}","${item.quantidade}","${item.unidade}","${formatCurrency(item.valor_unitario_estimado)}","${formatCurrency(item.valor_total_item)}","${item.numero_nota}","${item.emitente_nome}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `venda_${data.venda.id}_detalhes.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFiltroClick = () => {
        const cliente = document.getElementById('filtro-cliente').value;
        const pedido = document.getElementById('filtro-pedido').value;
        const data = document.getElementById('filtro-data').value;

        const filtros = {};
        if (cliente) filtros.cliente = cliente;
        if (pedido) filtros.pedido = pedido;
        if (data) filtros.data = data;

        carregarHistoricoVendas(filtros);
    };

    const exportarParaCSV = () => {
        if (vendasData.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }

        const headers = [
            'ID da Venda',
            'Cliente Comprador',
            'Nº Pedido Compra',
            'Data da Venda',
            'Quantidade Total (Ton)',
            'Valor por Tonelada (R$)',
            'Valor Total (R$)',
            'Unidade Gestora'
        ];

        const rows = vendasData.map(venda => {
            const quantidadeTotalTon = parseFloat(venda.quantidade_total_ton || 0);
            const valorPorTonelada = quantidadeTotalTon > 0 ? parseFloat(venda.valor_total_venda) / quantidadeTotalTon : 0;

            return [
                venda.id,
                `"${venda.cliente_comprador_nome || ''}"`,
                venda.numero_pedido_compra || '',
                new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                quantidadeTotalTon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                valorPorTonelada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                parseFloat(venda.valor_total_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                venda.unidade_gestora_venda || ''
            ].join(';');
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(';') + "\n" 
            + rows.join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "historico_vendas.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Adiciona os listeners
    btnFiltrar.addEventListener('click', handleFiltroClick);
    btnFiltrar.handler = handleFiltroClick;

    btnExportar.addEventListener('click', exportarParaCSV);
    btnExportar.handler = exportarParaCSV;
    
    tabelaHistorico.addEventListener('click', handleTableClick);
    tabelaHistorico.handler = handleTableClick;

    // Carrega os dados iniciais
    carregarHistoricoVendas();

    console.log('Listeners para historico-vendas adicionados com sucesso.');
};
