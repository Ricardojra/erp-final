/**
 * registrar-venda.js
 * Script para o módulo de Registro de Vendas de Material.
 */

console.log("[Frontend] registrar-venda.js: Script file loaded.");

// --- Elementos da interface (jQuery selectors) ---
// Renomeados para refletir a busca por números de notas
const $searchNumerosNotas = $("#searchNumerosNotas");
const $btnBuscarNotas = $("#btnBuscarNotas"); // Renomeado o botão
const $notasDisponiveisTableBody = $("#notas-disponiveis-table tbody");
const $selectAllItemsCheckbox = $("#selectAllItems");
const $totalItensSelecionados = $("#total-itens-selecionados");

// Elementos do resumo da venda
const $quantidadeTotalVendida = $("#quantidade-total-vendida");
const $valorTotalPedido = $("#valor-total-pedido");
const $valorUnitarioMedio = $("#valor-unitario-medio");
const $itensSelecionadosCount = $("#itens-selecionados-count");

// Campos do formulário de venda (mantêm os nomes, pois são para o registro)
const $clienteCompradorNome = $("#clienteCompradorNome");
const $clienteCompradorDocumento = $("#clienteCompradorDocumento");
const $valorUnitarioVenda = $("#valorUnitarioVenda");
const $valorTotalVenda = $("#valorTotalVenda");
const $numeroPedidoCompraVenda = $("#numeroPedidoCompraVenda"); // Este campo é onde o usuário DIGITA o novo pedido de compra da venda
const $unidadeGestoraVenda = $("#unidadeGestoraVenda");
const $dataVenda = $("#dataVenda");
const $observacoesVenda = $("#observacoesVenda"); // Assumindo este ID agora
const $numeroNfServicoAxel = $("#numeroNfServicoAxel"); // Novo campo
const $clienteFinal = $("#clienteFinal"); // Novo campo
const $btnRegistrarVenda = $("#btnRegistrarVenda"); // Agora é um submit de formulário
const $feedbackSearchNotes = $("#feedback-search-notes");
const $feedbackVendaData = $("#feedback-venda-data");
const $feedbackMessage = $("#feedback-message");

// --- Variáveis de estado ---
let selectedItems = new Set(); // Armazena IDs dos itens_notas_fiscais selecionados.
let availableNotesAndItems = []; // Armazena os dados das notas e itens carregados.
// Não precisamos mais de 'currentPedidoCompra' como estado de busca,
// pois o pedido da venda será um novo input.

// --- Funções Auxiliares (mantidas as que são genéricas) ---
function showFeedback($targetElement, type, message) {
    $targetElement.removeClass().addClass(`alert alert-${type}`).text(message).removeClass('d-none');
}

/**
 * Calcula e atualiza o resumo da venda com base nos itens selecionados
 */
function updateVendaResumo() {
    const selectedItemsData = availableNotesAndItems.filter(item => 
        selectedItems.has(item.item_nota_fiscal_id || item.id)
    );

    // Calcular quantidade total em toneladas
    const quantidadeTotalTon = selectedItemsData.reduce((total, item) => {
        const quantidadeKg = parseFloat(item.quantidade) || 0;
        return total + (quantidadeKg / 1000); // Converter kg para toneladas
    }, 0);

    // Obter valor unitário digitado pelo usuário ou usar valor padrão
    const valorUnitarioDigitado = parseFloat($valorUnitarioVenda.val()) || 0;

    // Calcular valor total usando o valor unitário digitado pelo usuário
    let valorTotal = 0;
    if (valorUnitarioDigitado > 0) {
        // Se o usuário digitou um valor unitário, usar esse valor
        valorTotal = quantidadeTotalTon * valorUnitarioDigitado;
    } else {
        // Se não digitou, usar os valores unitários dos itens (se disponíveis)
        valorTotal = selectedItemsData.reduce((total, item) => {
            const valorUnitario = parseFloat(item.valor_unitario_estimado) || 0;
            const quantidadeKg = parseFloat(item.quantidade) || 0;
            const quantidadeTon = quantidadeKg / 1000;
            const valorItem = valorUnitario * quantidadeTon; // Valor por tonelada
            return total + valorItem;
        }, 0);
    }

    // Calcular valor unitário médio por tonelada
    const valorUnitarioMedio = quantidadeTotalTon > 0 ? valorTotal / quantidadeTotalTon : 0;

    // Atualizar elementos da interface
    $quantidadeTotalVendida.text(`${quantidadeTotalTon.toFixed(2)} Ton`);
    $valorTotalPedido.text(`R$ ${valorTotal.toFixed(2).replace('.', ',')}`);
    $valorUnitarioMedio.text(`R$ ${valorUnitarioMedio.toFixed(2).replace('.', ',')}/Ton`);
    $itensSelecionadosCount.text(selectedItemsData.length);

    // Atualizar o campo de valor total da venda automaticamente
    $valorTotalVenda.val(valorTotal.toFixed(2));
}

function updateSelectedItemCount() {
    const count = selectedItems.size;
    $totalItensSelecionados.text(`Total de itens selecionados: ${count} item(s).`);

    // Atualizar resumo da venda
    updateVendaResumo();

    // O botão de registrar venda só deve estar ativo se houver itens selecionados,
    // a unidade gestora da venda estiver preenchida E o NOVO número do pedido de compra da venda for preenchido
    const unidadeVendaPreenchida = $unidadeGestoraVenda.val().trim() !== "";
    const numeroPedidoVendaPreenchido = $numeroPedidoCompraVenda.val().trim() !== "";
    const hasItemsSelected = count > 0;

    if (hasItemsSelected && unidadeVendaPreenchida && numeroPedidoVendaPreenchido) {
        $btnRegistrarVenda.prop("disabled", false);
    } else {
        $btnRegistrarVenda.prop("disabled", true);
    }
}

/**
 * Carrega as notas fiscais e seus itens disponíveis do backend por NÚMEROS DE NOTAS.
 * @param {string} numerosNotasString - String contendo números de notas separados por vírgula.
 */
async function loadAvailableNotesByNumeros(numerosNotasString) {
    if (!numerosNotasString) {
        showFeedback(
            $feedbackSearchNotes,
            "warning",
            "Por favor, informe um ou mais números de notas fiscais (separados por vírgula)."
        );
        $notasDisponiveisTableBody.empty();
        selectedItems.clear();
        $selectAllItemsCheckbox.prop("checked", false);
        updateSelectedItemCount();
        return;
    }

    const numerosNotasArray = numerosNotasString.split(',').map(s => s.trim()).filter(s => s);
    if (numerosNotasArray.length === 0) {
        showFeedback(
            $feedbackSearchNotes,
            "warning",
            "Nenhum número de nota fiscal válido foi informado."
        );
        $notasDisponiveisTableBody.empty();
        selectedItems.clear();
        $selectAllItemsCheckbox.prop("checked", false);
        updateSelectedItemCount();
        return;
    }

    showFeedback(
        $feedbackSearchNotes,
        "info",
        `Buscando notas: ${numerosNotasArray.join(', ')}...`
    );

    try {
        // Usamos a API /api/notas-fiscais/consultar que já funciona com 'numeros_notas'
        const url = `/api/notas-fiscais/consultar?numeros_notas=${encodeURIComponent(
            numerosNotasArray.join(',')
        )}`;

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao carregar notas por número(s).");
        }
        const data = await response.json();
        availableNotesAndItems = data.notas || [];

        $notasDisponiveisTableBody.empty();
        selectedItems.clear();
        $selectAllItemsCheckbox.prop("checked", false);

        if (availableNotesAndItems.length === 0) {
            $notasDisponiveisTableBody.append(
                '<tr><td colspan="10" class="text-center">Nenhuma nota fiscal encontrada para os números informados ou já foram vendidas/canceladas.</td></tr>'
            );
            showFeedback(
                $feedbackSearchNotes,
                "warning",
                `Nenhuma nota fiscal encontrada ou disponível para os números: ${numerosNotasArray.join(', ')}.`
            );
            return;
        }

        // Filtra notas que já estão vendidas ou canceladas para não permitir seleção
        // (A API de consulta pode retornar todas, então o frontend filtra para seleção)
        availableNotesAndItems = availableNotesAndItems.filter(item =>
            item.status !== 'vendida' && item.status !== 'cancelada'
        );

        if (availableNotesAndItems.length === 0) {
             $notasDisponiveisTableBody.append(
                '<tr><td colspan="10" class="text-center">As notas fiscais encontradas já foram vendidas ou canceladas.</td></tr>'
            );
            showFeedback(
                $feedbackSearchNotes,
                "warning",
                `As notas fiscais encontradas para os números: ${numerosNotasArray.join(', ')} já foram vendidas ou canceladas.`
            );
            return;
        }

        // Preenche a tabela com os dados
        availableNotesAndItems.forEach((item) => {
            const quantidadeKg = parseFloat(item.quantidade) || 0;
            const quantidadeTon = quantidadeKg / 1000;
            const valorUnitario = parseFloat(item.valor_unitario_estimado) || 0;
            const valorTotal = valorUnitario * quantidadeTon;

            const row = `
                <tr>
                  <td style="width: 50px;"><input type="checkbox" class="select-item" data-item-id="${item.item_nota_fiscal_id || item.id}"></td>
                  <td>${item.numero_nota}</td>
                  <td>${new Date(item.data_emissao).toLocaleDateString()}</td>
                  <td>${item.emitente_nome || "N/A"}</td>
                  <td>${item.unidade_gestora || "N/A"}</td>
                  <td>${item.material || "N/A"}</td>
                  <td>${quantidadeTon.toFixed(2)}</td>
                  <td>R$ ${valorUnitario.toFixed(2).replace('.', ',')}</td>
                  <td>R$ ${valorTotal.toFixed(2).replace('.', ',')}</td>
                  <td>${item.status}</td>
                </tr>
            `;
            $notasDisponiveisTableBody.append(row);
        });



        showFeedback(
            $feedbackSearchNotes,
            "success",
            `Notas encontradas: ${availableNotesAndItems.length}.`
        );
    } catch (error) {
        console.error("[Frontend] Erro ao carregar notas por números:", error);
        showFeedback(
            $feedbackSearchNotes,
            "danger",
            `Erro ao carregar notas: ${error.message}`
        );
    } finally {
        updateSelectedItemCount();
    }
}

/**
 * Registra a venda dos itens selecionados no backend.
 */
async function registrarVenda(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    if (selectedItems.size === 0) {
        showFeedback(
            $feedbackMessage,
            "warning",
            "Nenhum item selecionado para venda."
        );
        return;
    }

    const vendaData = {
        cliente_nome: $clienteCompradorNome.val().trim(),
        cliente_documento: $clienteCompradorDocumento.val().trim(),
        valor_total: parseFloat($valorTotalVenda.val()),
        numero_pedido_compra: $numeroPedidoCompraVenda.val().trim(),
        unidade_gestora: $unidadeGestoraVenda.val().trim(),
        data_venda: $dataVenda.val(),
        observacoes: $observacoesVenda.val().trim(),
        itens_vendidos_ids: Array.from(selectedItems),
        numero_nf_servico: $numeroNfServicoAxel.val().trim(),
        cliente_final: $clienteFinal.val().trim(),
        valor_por_tonelada: parseFloat($valorUnitarioVenda.val()) || null // <-- Adicionado
    };

    // Validação dos dados essenciais para registrar a venda
    if (
        !vendaData.cliente_nome ||
        isNaN(vendaData.valor_total) ||
        vendaData.valor_total <= 0 ||
        !vendaData.data_venda ||
        !vendaData.unidade_gestora ||
        !vendaData.numero_pedido_compra
    ) {
        showFeedback(
            $feedbackVendaData,
            "danger",
            "Por favor, preencha todos os dados obrigatórios da transação de venda (Cliente, Valor Total, Pedido de Compra, Unidade Gestora, Data da Venda)."
        );
        return;
    }

    // Validação adicional para garantir que há itens selecionados
    if (selectedItems.size === 0) {
        showFeedback(
            $feedbackVendaData,
            "danger",
            "Por favor, selecione pelo menos um item para venda."
        );
        return;
    }

    showFeedback($feedbackMessage, "info", "Registrando venda...");

    try {
        const response = await fetch("/api/vendas/registrar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(vendaData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao registrar venda.");
        }

        const result = await response.json();
        
        // Criar mensagem de sucesso mais informativa usando dados do backend
        const dadosVenda = result.dados_venda || {};
        const clienteNome = dadosVenda.cliente_nome || $clienteCompradorNome.val().trim();
        const valorTotal = dadosVenda.valor_total || parseFloat($valorTotalVenda.val());
        const itensVendidos = dadosVenda.itens_vendidos || selectedItems.size;
        const notasAtualizadas = dadosVenda.notas_atualizadas || 0;
        
        const mensagemSucesso = `✅ Venda registrada com sucesso!
        
📋 Detalhes da Venda:
• Cliente: ${clienteNome}
• Itens vendidos: ${itensVendidos} item(s)
• Valor total: R$ ${valorTotal.toFixed(2).replace('.', ',')}
• Notas atualizadas: ${notasAtualizadas} nota(s) fiscal(is) marcada(s) como "vendida"

✅ Status das notas fiscais foi atualizado com sucesso no banco de dados.`;
        
        showFeedback(
            $feedbackMessage,
            "success",
            mensagemSucesso
        );

        // Limpar formulário e recarregar notas
        $("#formRegistrarVenda")[0].reset();
        $dataVenda.val(new Date().toISOString().split("T")[0]);
        selectedItems.clear();
        $selectAllItemsCheckbox.prop("checked", false);
        $searchNumerosNotas.val("");
        availableNotesAndItems = [];
        $notasDisponiveisTableBody.empty();
        updateSelectedItemCount();

    } catch (error) {
        console.error("[Frontend] Erro ao registrar venda:", error);
        showFeedback(
            $feedbackMessage,
            "danger",
            `Erro ao registrar venda: ${error.message}`
        );
    } finally {
        updateSelectedItemCount();
    }
}

// --- Event Listeners ---
window.initRegistrarVenda = function () {
    console.log("[Frontend] initRegistrarVenda: Módulo iniciado.");

    // Preenche a data atual no campo de data da venda
    $dataVenda.val(new Date().toISOString().split("T")[0]);

    // Opcional: Chama uma busca inicial vazia para limpar a tabela ou mostrar mensagem
    loadAvailableNotesByNumeros("");

    // Evento de clique para o botão de buscar notas por NÚMEROS
    $btnBuscarNotas.on("click", function () { // ID do botão foi alterado para #btnBuscarNotas
        console.log("[Frontend] Botão 'Buscar Notas' clicado.");
        const numerosNotas = $searchNumerosNotas.val().trim(); // ID do campo foi alterado para #searchNumerosNotas
        loadAvailableNotesByNumeros(numerosNotas);
    });

    // Evento para o checkbox "Selecionar Todos"
    $selectAllItemsCheckbox.on("change", function () {
        const isChecked = $(this).prop("checked");
        $(".select-item").prop("checked", isChecked).trigger("change");
    });

    // Evento para os checkboxes de itens individuais (delegação para o tbody)
    $notasDisponiveisTableBody.on("change", ".select-item", function () {
        // ID do item pode ser item_nota_fiscal_id OU id da nota fiscal, dependendo da API
        const itemId = $(this).data("item-id");
        if ($(this).prop("checked")) {
            selectedItems.add(itemId);
        } else {
            selectedItems.delete(itemId);
        }
        updateSelectedItemCount();

        // Atualiza o checkbox "Selecionar Todos" com base na seleção dos itens individuais
        const totalCheckboxes = $(".select-item").length;
        const checkedCheckboxes = $(".select-item:checked").length;
        if (totalCheckboxes > 0 && checkedCheckboxes === totalCheckboxes) {
            $selectAllItemsCheckbox.prop("checked", true);
        } else if (checkedCheckboxes === 0) {
            $selectAllItemsCheckbox.prop("checked", false);
        }
    });

    // Listener para os campos do formulário de venda para habilitar/desabilitar o botão de registrar venda
    $unidadeGestoraVenda.on("input", updateSelectedItemCount);
    $numeroPedidoCompraVenda.on("input", updateSelectedItemCount);
    
    // Listener para o campo de valor unitário para atualizar cálculos automaticamente
    $valorUnitarioVenda.on("input", updateVendaResumo);

    // Evento de submit para o formulário de venda
    // O botão registrarVenda agora é tipo submit dentro de um form
    $("#formRegistrarVenda").on("submit", registrarVenda);

    // Desabilita o botão de registrar venda inicialmente
    $btnRegistrarVenda.prop("disabled", true);
};

window.cleanupRegistrarVenda = function () {
    console.log("[Frontend] cleanupRegistrarVenda: Removendo listeners e limpando estado.");
    // Remove event listeners específicos do módulo
    $btnBuscarNotas.off("click"); // Alterado para o novo ID do botão
    $selectAllItemsCheckbox.off("change");
    $notasDisponiveisTableBody.off("change", ".select-item");
    $unidadeGestoraVenda.off("input");
    $numeroPedidoCompraVenda.off("input");
    $valorUnitarioVenda.off("input");
    $("#formRegistrarVenda").off("submit", registrarVenda); // Remove o listener do form

    // Limpa variáveis de estado
    selectedItems.clear();
    availableNotesAndItems = [];
};