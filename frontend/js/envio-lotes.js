/**
 * envio-lotes.js
 * Script para gerenciamento de envio de lotes de notas fiscais para unidades gestoras
 */

// Variáveis globais
let lotesDisponiveis = [];
let lotesSelecionados = [];

/**
 * Inicializa o módulo de envio de lotes
 */
function initEnvioLotes() {
  console.log("Módulo de envio de lotes inicializado");

  // Inicializar os elementos
  setupEventListeners();
  preencherAnoAtual();
  preencherClientes();
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
  // Botão de consulta
  document
    .getElementById("btn-consultar")
    .addEventListener("click", consultarLotes);

  // Checkbox para selecionar todos
  document
    .getElementById("selecionar-todos")
    .addEventListener("change", selecionarTodosLotes);

  // Botões de confirmação e cancelamento
  document
    .getElementById("btn-confirmar-envio")
    .addEventListener("click", confirmarEnvio);
  document
    .getElementById("btn-cancelar")
    .addEventListener("click", cancelarOperacao);
}

/**
 * Preenche o campo de ano com o ano atual
 */
function preencherAnoAtual() {
  const selectAno = document.getElementById("ano");
  selectAno.innerHTML = '<option value="Todos" selected>Todos</option>';
  const anoAtual = new Date().getFullYear();
  for (let i = 0; i < 6; i++) {
    const ano = anoAtual - i;
    selectAno.innerHTML += `<option value="${ano}">${ano}</option>`;
  }
}

// Preencher clientes conforme material e ano selecionados
document.getElementById('material').addEventListener('change', atualizarClientesPorMaterialEAno);
document.getElementById('ano').addEventListener('change', atualizarClientesPorMaterialEAno);

function atualizarClientesPorMaterialEAno() {
  const material = document.getElementById('material').value;
  const ano = document.getElementById('ano').value;
  const select = document.getElementById('cliente-prioritario');
  if (!material) {
    select.innerHTML = '<option value="" selected>-- Selecione --</option>';
    return;
  }
  fetch(`/api/lotes/clientes-por-material?material=${encodeURIComponent(material)}&ano=${encodeURIComponent(ano)}`)
    .then(res => res.json())
    .then(data => {
      select.innerHTML = '<option value="" selected>-- Selecione --</option>';
      if (data.success && Array.isArray(data.clientes)) {
        data.clientes.forEach(cliente => {
          select.innerHTML += `<option value="${cliente.cliente_id}">${cliente.emitente_nome}</option>`;
        });
      }
    })
    .catch(() => {
      select.innerHTML = '<option value="" selected>-- Selecione --</option>';
    });
}

/**
 * Busca clientes e preenche o select de cliente prioritário
 */
function preencherClientes() {
  // Não faz mais nada, pois agora o preenchimento é dinâmico por material/ano
}

/**
 * Consulta os lotes disponíveis conforme os critérios
 */
function consultarLotes() {
  const ano = document.getElementById("ano").value;
  const quantidade = parseFloat(document.getElementById("quantidade").value);
  const material = document.getElementById("material").value;
  const clienteId = document.getElementById("cliente-prioritario").value;

  // Validar campos
  if (!ano || !quantidade || !material || !clienteId) {
    mostrarErro(
      "Preencha todos os campos para consultar os lotes disponíveis."
    );
    return;
  }

  mostrarErro("Consultando lotes, aguarde...", "info");

  // Consulta ao backend (agora passando todos os filtros)
  fetch(`/api/lotes/consultar-notas?material=${material}&ano=${ano}&clienteId=${clienteId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.success || !Array.isArray(data.notas) || data.notas.length === 0) {
        mostrarErro(data.message || "Nenhuma nota fiscal encontrada para o material selecionado.");
        document.getElementById("tabela-lotes").classList.add("hidden");
        document.getElementById("envio-lote").classList.add("hidden");
        document.getElementById("total-quantidade").textContent = '';
        return;
      }

      // Ordenar por data mais antiga
      const notasOrdenadas = data.notas.sort((a, b) => new Date(a.dataEmissao) - new Date(b.dataEmissao));
      // Selecionar notas até atingir a quantidade desejada (com margem de 5%)
      let soma = 0;
      const selecionadas = [];
      const limite = quantidade * 1.05;
      for (const nota of notasOrdenadas) {
        if (soma >= quantidade) break;
        // Se nenhuma nota foi selecionada ainda, permita selecionar a primeira mesmo que ultrapasse o limite
        if (soma > 0 && soma + nota.quantidade > limite) break;
        selecionadas.push(nota);
        soma += nota.quantidade;
      }
      // Se não atingiu a quantidade mínima, mostrar erro
      if (selecionadas.length === 0 || soma < quantidade) {
        mostrarErro("Não foi possível encontrar notas suficientes para atingir a quantidade desejada.");
        document.getElementById("tabela-lotes").classList.add("hidden");
        document.getElementById("envio-lote").classList.add("hidden");
        document.getElementById("total-quantidade").textContent = '';
        return;
      }

      lotesDisponiveis = selecionadas;
      lotesSelecionados = [...selecionadas];
      document.getElementById("mensagem-erro").classList.add("hidden");
      preencherTabela(lotesDisponiveis);
      document.getElementById("tabela-lotes").classList.remove("hidden");
      document.getElementById("envio-lote").classList.remove("hidden");
      // Exibir total
      document.getElementById("total-quantidade").textContent = `Notas selecionadas: ${selecionadas.length} | Total selecionado: ${soma.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})} Ton`;
      document.getElementById("selecionar-todos").checked = true;
    })
    .catch(error => {
      console.error("Erro ao consultar lotes:", error);
      mostrarErro("Falha ao conectar com o servidor. Verifique o console para mais detalhes.");
      document.getElementById("total-quantidade").textContent = '';
    });
}

/**
 * Preenche a tabela com os lotes disponíveis
 * @param {Array} lotes - Array de objetos com dados dos lotes
 */
function preencherTabela(lotes) {
  const tbody = document.getElementById("corpo-tabela");
  tbody.innerHTML = "";

  lotes.forEach((lote, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" data-index="${index}" class="checkbox-lote"></td>
      <td>${lote.numeroNF}</td>
      <td>${formatarData(lote.dataEmissao)}</td>
      <td>${lote.emitenteNome}</td>
      <td>${lote.material}</td>
      <td>${lote.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    `;

    // Adicionar listener para os checkboxes individuais
    tr.querySelector(".checkbox-lote").addEventListener("change", function () {
      const idx = parseInt(this.getAttribute("data-index"));
      if (this.checked) {
        lotesSelecionados.push(lotes[idx]);
      } else {
        lotesSelecionados = lotesSelecionados.filter(
          (l) => l.numeroNF !== lots[idx].numeroNF
        );
      }

      // Atualizar estado do checkbox "selecionar todos"
      document.getElementById("selecionar-todos").checked =
        lotesSelecionados.length === lotes.length;
    });

    tbody.appendChild(tr);
  });
}

/**
 * Seleciona ou desmarca todos os lotes
 */
function selecionarTodosLotes() {
  const selecionarTodos = document.getElementById("selecionar-todos").checked;
  const checkboxes = document.querySelectorAll(".checkbox-lote");

  checkboxes.forEach((checkbox) => {
    checkbox.checked = selecionarTodos;
  });

  // Atualizar array de selecionados
  lotesSelecionados = selecionarTodos ? [...lotesDisponiveis] : [];
}

/**
 * Confirma o envio dos lotes selecionados
 */
function confirmarEnvio() {
  const unidadeGestora = document.getElementById("unidade-gestora").value;

  if (!unidadeGestora) {
    mostrarErro("Selecione uma unidade gestora para continuar.");
    return;
  }

  if (lotesSelecionados.length === 0) {
    mostrarErro("Selecione pelo menos um lote para enviar.");
    return;
  }

  // Aqui seria feita a chamada à API para efetuar o envio
  // Por enquanto, apenas mostramos um feedback
  const totalQuantidade = lotesSelecionados.reduce(
    (sum, lote) => sum + lote.quantidade,
    0
  );

  // Enviar dados para o backend real
  const notasIds = lotesSelecionados.map(lote => lote.id);

  fetch('/api/lotes/criar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      unidadeGestora: unidadeGestora, 
      notasIds: notasIds 
    }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      mostrarErro(`Lote ${data.loteNumero} criado com sucesso para ${unidadeGestora}!`, 'success');
      
      // Limpar a tela após o sucesso
      document.getElementById("tabela-lotes").classList.add("hidden");
      document.getElementById("envio-lote").classList.add("hidden");
      document.getElementById("ano").value = new Date().getFullYear();
      document.getElementById("quantidade").value = "";
      document.getElementById("material").value = "";
      document.getElementById("unidade-gestora").value = "";

    } else {
      throw new Error(data.message || 'Falha ao criar o lote no servidor.');
    }
  })
  .catch(error => {
    console.error("Erro ao criar lote:", error);
    mostrarErro(error.message, 'error');
  });
}

/**
 * Cancela a operação atual
 */
function cancelarOperacao() {
  document.getElementById("tabela-lotes").classList.add("hidden");
  document.getElementById("envio-lote").classList.add("hidden");
  document.getElementById("mensagem-erro").classList.add("hidden");
}

/**
 * Exibe mensagem de erro ou informação
 * @param {string} mensagem - Texto da mensagem
 * @param {string} tipo - Tipo da mensagem (error, info)
 */
function mostrarErro(mensagem, tipo = "error") {
  const elementoMensagem = document.getElementById("mensagem-erro");
  elementoMensagem.textContent = mensagem;
  elementoMensagem.classList.remove("hidden", "error", "info");
  elementoMensagem.classList.add(tipo);
}

/**
 * Formata data para exibição
 * @param {string} data - Data no formato ISO
 * @returns {string} Data formatada como DD/MM/AAAA
 */
function formatarData(data) {
  if (!data) return "-";
  return window.appUtils.formatDate(data, "dd/MM/yyyy");
}

/**
 * Função de limpeza para quando a página for descarregada
 */
function cleanupEnvioLotes() {
  console.log("Limpeza do módulo de envio de lotes");

  // Remover event listeners
  document
    .getElementById("btn-consultar")
    ?.removeEventListener("click", consultarLotes);
  document
    .getElementById("selecionar-todos")
    ?.removeEventListener("change", selecionarTodosLotes);
  document
    .getElementById("btn-confirmar-envio")
    ?.removeEventListener("click", confirmarEnvio);
  document
    .getElementById("btn-cancelar")
    ?.removeEventListener("click", cancelarOperacao);

  // Limpar variáveis globais
  lotesDisponiveis = [];
  lotesSelecionados = [];
}

// Exportar funções para uso global
window.initEnvioLotes = initEnvioLotes;
window.cleanupEnvioLotes = cleanupEnvioLotes;
