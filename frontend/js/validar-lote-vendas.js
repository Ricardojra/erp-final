// validar-lote-vendas.js
// Módulo de validação de lotes de vendas do AXEL ERP

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Valida um lote de vendas
 */
async function validarLote() {
    const itensIds = document.getElementById('itens-ids').value.trim();
    const clienteNome = document.getElementById('cliente-nome').value.trim();
    const numeroPedidoCompra = document.getElementById('numero-pedido-compra').value.trim();
    const valorTotal = document.getElementById('valor-total').value;
    const unidadeGestora = document.getElementById('unidade-gestora').value.trim();

    // Validações básicas do frontend
    if (!itensIds) {
        mostrarErro('Por favor, informe os IDs dos itens.');
        return;
    }

    if (!clienteNome) {
        mostrarErro('Por favor, informe o nome do cliente.');
        return;
    }

    if (!numeroPedidoCompra) {
        mostrarErro('Por favor, informe o número do pedido de compra.');
        return;
    }

    if (!valorTotal || parseFloat(valorTotal) <= 0) {
        mostrarErro('Por favor, informe um valor total válido.');
        return;
    }

    if (!unidadeGestora) {
        mostrarErro('Por favor, informe a unidade gestora.');
        return;
    }

    // Converter string de IDs em array
    const itensIdsArray = itensIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (itensIdsArray.length === 0) {
        mostrarErro('Por favor, informe IDs válidos.');
        return;
    }

    // Mostrar loading
    mostrarLoading(true);
    ocultarResultado();

    try {
        const response = await fetch(`${API_BASE_URL}/validar-lote-vendas/validar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itens_vendidos_ids: itensIdsArray,
                cliente_nome: clienteNome,
                numero_pedido_compra: numeroPedidoCompra,
                valor_total: parseFloat(valorTotal),
                unidade_gestora: unidadeGestora
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            mostrarSucesso(data);
        } else {
            mostrarErro(data.message || 'Erro na validação do lote.', data);
        }

    } catch (error) {
        console.error('Erro ao validar lote:', error);
        mostrarErro('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Valida um item específico
 */
async function validarItem(itemId) {
    if (!itemId) {
        mostrarErro('ID do item é obrigatório.');
        return;
    }

    mostrarLoading(true);
    ocultarResultado();

    try {
        const response = await fetch(`${API_BASE_URL}/validar-lote-vendas/item/${itemId}`);
        const data = await response.json();

        if (response.ok && data.success) {
            mostrarValidacaoItem(data);
        } else {
            mostrarErro(data.message || 'Erro ao validar item.');
        }

    } catch (error) {
        console.error('Erro ao validar item:', error);
        mostrarErro('Erro de conexão ao validar item.');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Carrega estatísticas de validação
 */
async function carregarEstatisticas() {
    mostrarLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/validar-lote-vendas/estatisticas`);
        const data = await response.json();

        if (response.ok && data.success) {
            mostrarEstatisticas(data.estatisticas);
        } else {
            mostrarErro('Erro ao carregar estatísticas.');
        }

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        mostrarErro('Erro de conexão ao carregar estatísticas.');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Mostra resultado de sucesso na validação
 */
function mostrarSucesso(data) {
    const resultadoDiv = document.getElementById('resultado-validacao');
    
    let html = `
        <div class="resultado-sucesso">
            <h3>✅ Lote Validado com Sucesso!</h3>
            <p><strong>${data.message}</strong></p>
            
            <div class="resumo-validacao">
                <h4>📋 Resumo da Validação:</h4>
                <ul>
                    <li><strong>Total de Itens:</strong> ${data.resumo.total_itens}</li>
                    <li><strong>Valor Total:</strong> R$ ${data.resumo.valor_total}</li>
                    <li><strong>Materiais Diferentes:</strong> ${data.resumo.materiais_diferentes}</li>
                    <li><strong>Cliente:</strong> ${data.resumo.cliente}</li>
                    <li><strong>Número do Pedido de Compra:</strong> ${data.resumo.numero_pedido_compra}</li>
                    <li><strong>Unidade Gestora:</strong> ${data.resumo.unidade_gestora}</li>
                </ul>
            </div>
        </div>
    `;

    // Mostrar pedidos de compra encontrados se houver
    if (data.resumo.pedidos_compra_encontrados && data.resumo.pedidos_compra_encontrados.length > 0) {
        html += `
            <div class="pedidos-info">
                <h4>📋 Pedidos de Compra Encontrados:</h4>
                <ul>
                    ${data.resumo.pedidos_compra_encontrados.map(pedido => `
                        <li><strong>Pedido:</strong> ${pedido}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    if (data.itens_validados && data.itens_validados.length > 0) {
        html += `
            <div class="itens-lista">
                <h4>📦 Itens Validados:</h4>
                ${data.itens_validados.map(item => `
                    <div class="item-card item-valido">
                        <div class="item-info">
                            <strong>ID:</strong> ${item.id} | 
                            <strong>Material:</strong> ${item.material} | 
                            <strong>Quantidade:</strong> ${item.quantidade} | 
                            <strong>Valor Unitário:</strong> R$ ${item.valor_unitario_estimado} | 
                            <strong>Nota Fiscal:</strong> ${item.numero_nota}
                            ${item.pedido_atual ? ` | <strong>Pedido Atual:</strong> ${item.pedido_atual}` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    resultadoDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
}

/**
 * Mostra resultado de erro na validação
 */
function mostrarErro(mensagem, detalhes = null) {
    const resultadoDiv = document.getElementById('resultado-validacao');
    
    let html = `
        <div class="resultado-erro">
            <h3>❌ Erro na Validação</h3>
            <p><strong>${mensagem}</strong></p>
        </div>
    `;

    if (detalhes) {
        if (detalhes.itens_com_problemas && detalhes.itens_com_problemas.length > 0) {
            html += `
                <div class="itens-lista">
                    <h4>⚠️ Itens com Problemas:</h4>
                    ${detalhes.itens_com_problemas.map(item => `
                        <div class="item-card item-problema">
                            <div class="item-info">
                                <strong>ID:</strong> ${item.id} | 
                                <strong>Material:</strong> ${item.material} | 
                                <strong>Quantidade:</strong> ${item.quantidade} | 
                                <strong>Nota Fiscal:</strong> ${item.numero_nota}
                            </div>
                            <div class="problemas">
                                <strong>Problemas:</strong>
                                <ul>
                                    ${item.problemas.map(problema => `<li>${problema}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (detalhes.disponibilidade_estoque && detalhes.disponibilidade_estoque.length > 0) {
            html += `
                <div class="itens-lista">
                    <h4>📊 Problemas de Estoque:</h4>
                    ${detalhes.disponibilidade_estoque.map(item => `
                        <div class="item-card item-problema">
                            <div class="item-info">
                                <strong>Material:</strong> ${item.material} | 
                                <strong>Quantidade Solicitada:</strong> ${item.quantidade_solicitada} | 
                                <strong>Quantidade Disponível:</strong> ${item.quantidade_disponivel} | 
                                <strong>Déficit:</strong> ${item.deficit}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (detalhes.detalhes) {
            html += `
                <div class="detalhes-erro">
                    <h4>🔍 Detalhes do Erro:</h4>
                    <pre>${JSON.stringify(detalhes.detalhes, null, 2)}</pre>
                </div>
            `;
        }
    }

    resultadoDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
}

/**
 * Mostra validação de item específico
 */
function mostrarValidacaoItem(data) {
    const resultadoDiv = document.getElementById('resultado-validacao');
    
    const statusClass = data.validacao.is_valido ? 'item-valido' : 'item-problema';
    const statusIcon = data.validacao.is_valido ? '✅' : '❌';
    const statusText = data.validacao.is_valido ? 'Válido' : 'Com Problemas';

    let html = `
        <div class="resultado-${data.validacao.is_valido ? 'sucesso' : 'erro'}">
            <h3>${statusIcon} Validação do Item</h3>
            <p><strong>Status:</strong> ${statusText}</p>
            
            <div class="item-card ${statusClass}">
                <div class="item-info">
                    <strong>ID:</strong> ${data.item.id} | 
                    <strong>Material:</strong> ${data.item.material} | 
                    <strong>Quantidade:</strong> ${data.item.quantidade} | 
                    <strong>Valor Unitário:</strong> R$ ${data.item.valor_unitario_estimado} | 
                    <strong>Nota Fiscal:</strong> ${data.item.numero_nota} | 
                    <strong>Emitente:</strong> ${data.item.emitente_nome} | 
                    <strong>Status da Nota:</strong> ${data.item.status_nota}
                    ${data.item.pedido_atual ? ` | <strong>Pedido de Compra:</strong> ${data.item.pedido_atual}` : ''}
                </div>
            </div>
        </div>
    `;

    if (data.validacao.problemas && data.validacao.problemas.length > 0) {
        html += `
            <div class="itens-lista">
                <h4>⚠️ Problemas Encontrados:</h4>
                <ul>
                    ${data.validacao.problemas.map(problema => `<li>${problema}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    if (data.validacao.avisos && data.validacao.avisos.length > 0) {
        html += `
            <div class="itens-lista">
                <h4>⚠️ Avisos:</h4>
                <ul>
                    ${data.validacao.avisos.map(aviso => `<li>${aviso}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    html += `
        <div class="estatistica-card">
            <div class="estatistica-valor">${data.validacao.quantidade_disponivel_estoque}</div>
            <div class="estatistica-label">Quantidade Disponível no Estoque</div>
        </div>
    `;

    resultadoDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
}

/**
 * Mostra estatísticas de validação
 */
function mostrarEstatisticas(estatisticas) {
    const estatisticasDiv = document.getElementById('estatisticas');
    
    const html = `
        <div class="estatistica-card">
            <div class="estatistica-valor">${estatisticas.vendas.total}</div>
            <div class="estatistica-label">Total de Vendas</div>
        </div>
        <div class="estatistica-card">
            <div class="estatistica-valor">${estatisticas.vendas.ultimos_30_dias}</div>
            <div class="estatistica-label">Vendas (Últimos 30 dias)</div>
        </div>
        <div class="estatistica-card">
            <div class="estatistica-valor">R$ ${estatisticas.vendas.valor_total.toFixed(2)}</div>
            <div class="estatistica-label">Valor Total Vendido</div>
        </div>
        <div class="estatistica-card">
            <div class="estatistica-valor">${estatisticas.vendas.clientes_diferentes}</div>
            <div class="estatistica-label">Clientes Diferentes</div>
        </div>
        <div class="estatistica-card">
            <div class="estatistica-valor">${estatisticas.itens.total}</div>
            <div class="estatistica-label">Total de Itens</div>
        </div>
        <div class="estatistica-card">
            <div class="estatistica-valor">${estatisticas.itens.status_invalido}</div>
            <div class="estatistica-label">Itens com Status Inválido</div>
        </div>
        <div class="estatistica-card">
            <div class="estatistica-valor">${estatisticas.itens.ja_vendidos}</div>
            <div class="estatistica-label">Itens Já Vendidos</div>
        </div>
    `;

    estatisticasDiv.innerHTML = html;
    estatisticasDiv.style.display = 'grid';
}

/**
 * Mostra/esconde loading
 */
function mostrarLoading(mostrar) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = mostrar ? 'block' : 'none';
}

/**
 * Oculta resultado
 */
function ocultarResultado() {
    const resultadoDiv = document.getElementById('resultado-validacao');
    resultadoDiv.style.display = 'none';
}

/**
 * Limpa formulário
 */
function limparFormulario() {
    document.getElementById('itens-ids').value = '';
    document.getElementById('cliente-nome').value = '';
    document.getElementById('numero-pedido-compra').value = '';
    document.getElementById('valor-total').value = '';
    document.getElementById('unidade-gestora').value = '';
    ocultarResultado();
    document.getElementById('estatisticas').style.display = 'none';
}

/**
 * Volta para a página inicial
 */
function voltarInicio() {
    window.location.href = '../main.html';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Carregar estatísticas automaticamente
    carregarEstatisticas();
    
    // Adicionar validação em tempo real
    const itensIdsInput = document.getElementById('itens-ids');
    itensIdsInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value && !/^[\d,\s]+$/.test(value)) {
            this.style.borderColor = '#dc3545';
        } else {
            this.style.borderColor = '#e1e5e9';
        }
    });

    // Formatação automática do valor total
    const valorTotalInput = document.getElementById('valor-total');
    valorTotalInput.addEventListener('blur', function() {
        const value = parseFloat(this.value);
        if (!isNaN(value)) {
            this.value = value.toFixed(2);
        }
    });
});

// Exportar funções para uso global
window.validarLote = validarLote;
window.validarItem = validarItem;
window.carregarEstatisticas = carregarEstatisticas;
window.limparFormulario = limparFormulario;
window.voltarInicio = voltarInicio; 