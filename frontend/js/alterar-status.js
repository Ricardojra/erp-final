// Lógica Frontend para o Módulo de Envio por Número (Consulta e Alteração em Lote)

// Função para mostrar mensagens de feedback/erro
const mostrarMensagem = (elementoId, mensagem, tipo = "success") => {
  const feedbackEl = document.getElementById(elementoId);
  if (!feedbackEl) {
    console.error(`Elemento de feedback não encontrado: ${elementoId}`);
    return;
  }

  feedbackEl.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      <i class="fas ${
        tipo === "success" ? "fa-check-circle" : "fa-exclamation-circle"
      } me-2"></i>
      ${mensagem}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
};

// Mapeamento de cores para status
const statusBadgeClasses = {
  disponivel: "bg-primary",
  enviada: "bg-success",
  vendida: "bg-info",
  reprovada: "bg-danger",
  pendente: "bg-warning",
  ofertada: "bg-secondary",
};

// Mapeamento de mensagens de sucesso por status
const mensagensSucessoStatus = {
  disponivel: "Notas marcadas como disponíveis com sucesso.",
  enviada: "Notas marcadas como enviadas com sucesso.",
  vendida: "Notas marcadas como vendidas com sucesso.",
  reprovada: "Notas marcadas como reprovadas com sucesso.",
  pendente: "Notas marcadas como pendentes com sucesso.",
  ofertada: "Notas marcadas como ofertadas com sucesso.",
};

// Função principal de inicialização para a página envio-numero
window.initEnvioNumero = () => {
  console.log(
    "Inicializando lógica de Envio por Número (v5 - com verificação de material baseado em NCM)..."
  );

  // Elementos do DOM
  const consultaForm = document.getElementById("consulta-form");
  const seletorTodosCheckbox = document.getElementById("selecionar-todos");
  const btnAlterarLote = document.getElementById("btn-alterar-status");
  const mensagemErroDiv = document.getElementById("mensagem-erro");
  const tabelaContainer = document.getElementById("tabela-container");
  const alteracaoLoteDiv = document.getElementById("alterar-status");
  const feedbackMessageDiv = document.getElementById("feedback-message");
  const mensagemSucessoDiv = document.getElementById("mensagem-sucesso");
  const alertaSelecao = document.getElementById("alerta-selecao");

  // Limpar mensagens iniciais
  if (feedbackMessageDiv) feedbackMessageDiv.innerHTML = "";
  if (mensagemErroDiv) mensagemErroDiv.classList.add("d-none");
  if (mensagemSucessoDiv) mensagemSucessoDiv.classList.add("d-none");
  if (alertaSelecao) alertaSelecao.classList.add("d-none");

  // Evento de submissão do formulário de consulta
  if (!consultaForm) {
    console.error("Formulário de consulta não encontrado.");
    return;
  }

  consultaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Consulta form submit prevented.");

    const numerosInput = document.getElementById("numeros_notas");
    const corpoTabela = document.getElementById("corpo-tabela");
    const btnConsultar = document.getElementById("btn-consultar");

    // Resetar interface
    if (feedbackMessageDiv) feedbackMessageDiv.innerHTML = "";
    if (mensagemErroDiv) mensagemErroDiv.classList.add("d-none");
    if (tabelaContainer) tabelaContainer.classList.add("d-none");
    if (alteracaoLoteDiv) alteracaoLoteDiv.classList.add("d-none");
    if (corpoTabela) corpoTabela.innerHTML = "";
    if (seletorTodosCheckbox) seletorTodosCheckbox.checked = false;

    const numerosNotasStr = numerosInput?.value.trim() ?? "";
    if (!numerosNotasStr) {
      mostrarMensagem(
        "mensagem-erro",
        "Por favor, insira pelo menos um número de nota fiscal.",
        "warning"
      );
      if (mensagemErroDiv) mensagemErroDiv.classList.remove("d-none");
      return;
    }

    if (btnConsultar) btnConsultar.disabled = true;

    try {
      const response = await fetch(
        `/api/notas-fiscais/consultar?numeros_notas=${encodeURIComponent(
          numerosNotasStr
        )}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Erro ${response.status}: Falha ao consultar notas.`
        );
      }

      // --- ALTERAÇÕES AQUI ---
      // O backend retorna 'notas', não 'notas_encontradas' ou 'notas_nao_encontradas'.
      // Se data.notas for vazio, significa que nenhuma nota foi encontrada.
      if (data.notas && data.notas.length > 0) {
        if (corpoTabela) {
          corpoTabela.innerHTML = data.notas // Acessa diretamente data.notas
            .map((nota) => {
              const material =
                nota.material && nota.material !== "DESCONHECIDO"
                  ? nota.material
                  : "DESCONHECIDO";
              if (material === "DESCONHECIDO" && nota.ncm) {
                console.warn(
                  `NCM ${nota.ncm} não mapeado para material na nota ${nota.numero_nota}`
                );
              }

              return `
                <tr data-status="${nota.status}">
                  <td><input type="checkbox" class="nota-checkbox form-check-input" data-numero="${nota.numero_nota}" data-id="${nota.id}"></td>
                  <td>${nota.numero_nota}</td>
                  <td><span class="badge status-badge ${
                    statusBadgeClasses[nota.status] || "bg-secondary"
                  }">${nota.status}</span></td>
                  <td>${new Date(nota.data_emissao)
                    .toLocaleDateString("pt-BR")
                    .split("/")
                    .join("-")}</td>
                  <td>${nota.emitente_nome}</td>
                  <td>${nota.material}</td>
                  <td>${(parseFloat(nota.quantidade) / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td><span class="unidade-gestora-text">${
                    nota.unidade_gestora || "N/A"
                  }</span></td>
                </tr>
              `;
            })
            .join("");
        }
        if (tabelaContainer) tabelaContainer.classList.remove("d-none");
        if (alteracaoLoteDiv) alteracaoLoteDiv.classList.remove("d-none");

        // Se houver notas encontradas, e o campo de erro está visível, esconde-o.
        if (mensagemErroDiv) mensagemErroDiv.classList.add("d-none");
      } else {
        // Nenhuma nota encontrada
        mostrarMensagem(
          "mensagem-erro",
          "Nenhuma nota fiscal encontrada para os números fornecidos.",
          "info"
        );
        if (mensagemErroDiv) mensagemErroDiv.classList.remove("d-none");
      }
    } catch (error) {
      console.error("Erro na consulta:", error);
      mostrarMensagem(
        "mensagem-erro",
        error.message || "Erro de comunicação ao consultar.",
        "danger"
      );
      if (mensagemErroDiv) mensagemErroDiv.classList.remove("d-none");
    } finally {
      if (btnConsultar) btnConsultar.disabled = false;
    }
  });

  // Checkbox "Selecionar Todos"
  if (seletorTodosCheckbox) {
    seletorTodosCheckbox.addEventListener("change", (e) => {
      document.querySelectorAll(".nota-checkbox").forEach((checkbox) => {
        checkbox.checked = e.target.checked;
      });
    });
  }

  // Botão "Alterar Status"
  if (btnAlterarLote) {
    btnAlterarLote.setAttribute("type", "button");
    btnAlterarLote.addEventListener("click", async () => {
      console.log("Botão Alterar Status clicado.");

      const checkboxes = document.querySelectorAll(".nota-checkbox:checked");
      const novoStatusSelect = document.getElementById("novo_status_lote");
      const novaUnidadeGestoraInput = document.getElementById(
        "nova_unidade_gestora_lote"
      );

      // Resetar mensagens
      if (feedbackMessageDiv) feedbackMessageDiv.innerHTML = "";
      if (alertaSelecao) alertaSelecao.classList.add("d-none");
      if (mensagemSucessoDiv) mensagemSucessoDiv.classList.add("d-none");

      // Modificado para pegar o ID da nota em vez do número, se necessário para o POST de atualização
      const notasSelecionadasParaAtualizar = Array.from(checkboxes).map(
        (checkbox) => ({
          id: checkbox.dataset.id, // Pega o ID da nota
          numero_nota: checkbox.dataset.numero, // Mantém o número da nota para referência
        })
      );
      const novoStatus = novoStatusSelect?.value ?? "";
      const novaUnidadeGestora = novaUnidadeGestoraInput?.value.trim() ?? "";

      if (notasSelecionadasParaAtualizar.length === 0) {
        if (alertaSelecao) {
          alertaSelecao.classList.remove("d-none");
          alertaSelecao.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => alertaSelecao.classList.add("d-none"), 5000);
        }
        return;
      }

      if (!novoStatus && !novaUnidadeGestora) {
        mostrarMensagem(
          "feedback-message",
          "Selecione um novo status ou informe uma nova unidade gestora.",
          "warning"
        );
        return;
      }

      // Validação de status
      const statusPermitidos = [
        "disponivel",
        "enviada",
        "vendida",
        "reprovada",
        "pendente",
        "ofertada",
      ];
      if (novoStatus && !statusPermitidos.includes(novoStatus)) {
        mostrarMensagem(
          "feedback-message",
          `Status inválido: ${novoStatus}. Status permitidos: ${statusPermitidos.join(
            ", "
          )}`,
          "danger"
        );
        return;
      }

      // Validação de transições (opcional, descomente se necessário)

      const transicoesPermitidas = {
        disponivel: ["enviada", "pendente", "ofertada"],
        pendente: ["ofertada", "enviada", "reprovada"],
        ofertada: ["ofertada", "vendida", "reprovada"],
        enviada: ["ofertada", "vendida", "reprovada"],
        vendida: [],
        reprovada: ["disponivel"],
      };
      
      // Verificar se deve forçar a alteração
      const forcarAlteracao = document.getElementById("forcar_alteracao")?.checked || false;
      
      if (!forcarAlteracao) {
        // Aplicar validações de transição apenas se não estiver forçando
        const notasInvalidas = Array.from(checkboxes).filter((checkbox) => {
          const row = checkbox.closest("tr");
          const statusAtual = row?.dataset.status;
          return (
            statusAtual &&
            novoStatus &&
            !transicoesPermitidas[statusAtual]?.includes(novoStatus)
          );
        });
        
        if (notasInvalidas.length > 0) {
          const numerosInvalidos = notasInvalidas.map(
            (checkbox) => checkbox.dataset.numero
          );
          mostrarMensagem(
            "feedback-message",
            `Transição inválida para as notas ${numerosInvalidos.join(
              ", "
            )}. Status atual não permite mudança para ${novoStatus}. Marque a opção "Forçar alteração" para ignorar esta validação.`,
            "danger"
          );
          return;
        }
      } else {
        // Se estiver forçando, mostrar aviso
        console.log("⚠️ Modo de forçar alteração ativado - validações de transição ignoradas");
        mostrarMensagem(
          "feedback-message",
          "⚠️ Modo de forçar alteração ativado. As validações de transição foram ignoradas.",
          "warning"
        );
      }

      // Desabilitar o botão para evitar cliques duplos
      btnAlterarLote.disabled = true;
      btnAlterarLote.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Alterando...';

      try {
        // Usar a rota de atualização em lote com forçar alteração
        const response = await fetch('/api/notas-fiscais/atualizar-status-lote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notas: notasSelecionadasParaAtualizar.map(nota => nota.id),
            novo_status: novoStatus,
            nova_unidade_gestora: novaUnidadeGestora,
            forcarAlteracao: forcarAlteracao
          }),
        });
        
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Erro desconhecido ao alterar status.');
        }

        // Mostrar feedback baseado no resultado
        if (result.falhas > 0) {
          mostrarMensagem('feedback-message', 
            `Operação concluída com ${result.sucessos} sucesso(s) e ${result.falhas} falha(s).${forcarAlteracao ? ' (Alteração forçada)' : ''}`, 
            'warning'
          );
        } else {
          mostrarMensagem('mensagem-sucesso', 
            `Todas as ${result.sucessos} notas foram alteradas com sucesso!${forcarAlteracao ? ' (Alteração forçada)' : ''} A página será recarregada para refletir as mudanças.`, 
            'success'
          );
          
          // Recarregar a consulta para refletir as alterações
          setTimeout(() => {
            consultaForm.dispatchEvent(new Event('submit'));
          }, 2000);
        }

      } catch (error) {
        console.error('Erro ao alterar status:', error);
        mostrarMensagem('feedback-message', 
          `Erro ao alterar status: ${error.message}`, 
          'danger'
        );
      } finally {
        // Re-habilitar o botão
        btnAlterarLote.disabled = false;
        btnAlterarLote.innerHTML = '<i class="fas fa-check me-2"></i>Alterar Selecionadas';
      }
    });
  }
};

// ✅ Define função esperada pelo main.js
window.initAlterarStatus = () => {
  if (typeof window.initEnvioNumero === "function") {
    window.initEnvioNumero();
  }
};

console.log("alterar-status.js carregado e função initAlterarStatus definida.");
