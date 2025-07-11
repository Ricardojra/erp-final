(() => {
  // Função de teste
  const handleTeste = () => {
    alert("Teste realizado com sucesso!");
  };

  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text, element) => {
    // Usando document.execCommand('copy') como fallback para garantir compatibilidade em iFrames ou ambientes restritos
    // navigator.clipboard.writeText() pode ter restrições de segurança em certos contextos.
    if (document.execCommand) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed"; // Impede a rolagem para a área de texto
      textarea.style.opacity = "0"; // Torna invisível
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        // Feedback visual temporário
        const originalIconClass =
          element.querySelector(".copy-icon")?.className ||
          "fas fa-copy copy-icon";
        const feedbackText = element.querySelector(".copy-feedback");
        const icon = element.querySelector(".copy-icon");

        if (icon) {
          icon.className = "fas fa-check copy-icon text-success";
        }
        if (feedbackText) {
          feedbackText.textContent = "Copiado!";
          feedbackText.style.display = "inline";
        }

        setTimeout(() => {
          if (icon) {
            icon.className = originalIconClass;
          }
          if (feedbackText) {
            feedbackText.style.display = "none";
          }
        }, 1500);
      } catch (err) {
        console.error("Erro ao copiar texto com execCommand: ", err);
        // Fallback para navigator.clipboard se execCommand falhar ou não existir
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(text)
            .then(() => {
              const originalIconClass =
                element.querySelector(".copy-icon")?.className ||
                "fas fa-copy copy-icon";
              const feedbackText = element.querySelector(".copy-feedback");
              const icon = element.querySelector(".copy-icon");

              if (icon) {
                icon.className = "fas fa-check copy-icon text-success";
              }
              if (feedbackText) {
                feedbackText.textContent = "Copiado!";
                feedbackText.style.display = "inline";
              }

              setTimeout(() => {
                if (icon) {
                  icon.className = originalIconClass;
                }
                if (feedbackText) {
                  feedbackText.style.display = "none";
                }
              }, 1500);
            })
            .catch((err) => {
              console.error(
                "Erro ao copiar texto com navigator.clipboard: ",
                err
              );
              // Usar um modal personalizado em vez de alert()
              // alert("Erro ao copiar texto.");
              // Implemente aqui sua função de mostrar modal de erro
              showCustomModal(
                "Erro",
                "Falha ao copiar texto para a área de transferência."
              );
            });
        } else {
          // Usar um modal personalizado em vez de alert()
          // alert("Seu navegador não suporta a cópia automática.");
          // Implemente aqui sua função de mostrar modal de erro
          showCustomModal(
            "Erro",
            "Seu navegador não suporta a cópia automática."
          );
        }
      } finally {
        document.body.removeChild(textarea);
      }
    } else {
      // Usar um modal personalizado em vez de alert()
      // alert("Seu navegador não suporta a cópia automática.");
      // Implemente aqui sua função de mostrar modal de erro
      showCustomModal("Erro", "Seu navegador não suporta a cópia automática.");
    }
  };

  // Função auxiliar para criar um item de lista de resultado com cópia
  const createResultListItem = ({ filename, status, message }) => {
    const li = document.createElement("li");
    li.className = `mb-2 d-flex align-items-center text-${
      {
        success: "success",
        duplicate: "warning",
        error: "danger",
      }[status]
    } result-list-item`;

    const chaveNfeMatch = filename.match(/^(\d{44})/);
    const chaveNfe = chaveNfeMatch ? chaveNfeMatch[1] : filename;

    li.innerHTML = `
            <i class="fas ${
              {
                success: "fa-check-circle",
                duplicate: "fa-exclamation-triangle",
                error: "fa-times-circle",
              }[status]
            } me-2"></i>
            <div class="copyable-filename-container me-2" title="Clique para copiar a chave: ${chaveNfe}">
                <span class="copyable-filename">${filename}</span>
                <i class="fas fa-copy copy-icon"></i>
                <span class="copy-feedback" style="display: none; font-size: 0.8em; margin-left: 5px; color: green;"></span>
            </div>
            <span class="badge bg-${
              status === "duplicate"
                ? "warning text-dark"
                : status === "success"
                ? "success"
                : "danger"
            } ms-auto">${message}</span>
        `;

    const copyContainer = li.querySelector(".copyable-filename-container");
    if (copyContainer) {
      copyContainer.addEventListener("click", (e) => {
        e.stopPropagation();
        copyToClipboard(chaveNfe, copyContainer);
      });
    }

    return li;
  };

  // Função auxiliar para criar grupo expansível com limite de altura e rolagem
  const createExpandableGroup = (items, status, titlePrefix) => {
    const summaryLi = document.createElement("li");
    const alertClass = status === "error" ? "alert-danger" : "alert-warning";

    summaryLi.className = `alert ${alertClass} p-2 mt-2 ${status}-summary`;
    summaryLi.style.cursor = "pointer";
    summaryLi.innerHTML = `<i class="fas fa-plus-circle me-2"></i> <strong>${items.length} ${titlePrefix} (clique para expandir)</strong>`;

    const detailsUl = document.createElement("ul");
    detailsUl.className = `list-unstyled ms-4 mt-2 ${status}-details`;
    detailsUl.style.display = "none";
    detailsUl.style.maxHeight = "320px";
    detailsUl.style.overflowY = "auto";
    detailsUl.style.paddingRight = "10px";

    items.forEach((item) => detailsUl.appendChild(createResultListItem(item)));

    summaryLi.addEventListener("click", () => {
      const isHidden = detailsUl.style.display === "none";
      detailsUl.style.display = isHidden ? "block" : "none";
      summaryLi.querySelector("i").className = `fas ${
        isHidden ? "fa-minus-circle" : "fa-plus-circle"
      } me-2`;
    });

    return [summaryLi, detailsUl];
  };

  const mostrarResultados = (results) => {
    const feedback = document.getElementById("feedback-message");
    const resultList = document.getElementById("result-list");
    const resultHeader = document.getElementById("result-header");

    if (!feedback || !resultList || !resultHeader) return;

    feedback.classList.remove(
      "d-none",
      "alert-info",
      "alert-danger",
      "alert-warning"
    );
    feedback.classList.add("alert-light");
    resultHeader.classList.remove("d-none");
    resultList.innerHTML = "";

    if (results.length === 1) {
      resultList.appendChild(createResultListItem(results[0]));
    } else {
      const successResults = results.filter((r) => r.status === "success");
      const duplicateResults = results.filter((r) => r.status === "duplicate");
      const errorResults = results.filter((r) => r.status === "error");

      const summaryLi = document.createElement("li");
      summaryLi.className = "mb-3 fw-bold";
      summaryLi.innerHTML = `Resumo: ${successResults.length} sucesso(s), ${duplicateResults.length} duplicado(s), ${errorResults.length} erro(s).`;
      resultList.appendChild(summaryLi);

      if (duplicateResults.length > 0) {
        if (duplicateResults.length <= 5) {
          const duplicatesHeader = document.createElement("li");
          duplicatesHeader.className = "text-warning fw-bold mt-2 mb-1";
          duplicatesHeader.innerHTML = "Notas Duplicadas:";
          resultList.appendChild(duplicatesHeader);
          duplicateResults.forEach((result) =>
            resultList.appendChild(createResultListItem(result))
          );
        } else {
          const [summary, details] = createExpandableGroup(
            duplicateResults,
            "duplicate",
            "notas duplicadas"
          );
          resultList.appendChild(summary);
          resultList.appendChild(details);
        }
      }

      if (errorResults.length > 0) {
        if (errorResults.length <= 5) {
          const errorsHeader = document.createElement("li");
          errorsHeader.className = "text-danger fw-bold mt-2 mb-1";
          errorsHeader.innerHTML = "Erros na Importação:";
          resultList.appendChild(errorsHeader);
          errorResults.forEach((result) =>
            resultList.appendChild(createResultListItem(result))
          );
        } else {
          const [summary, details] = createExpandableGroup(
            errorResults,
            "error",
            "arquivos com erro"
          );
          resultList.appendChild(summary);
          resultList.appendChild(details);
        }
      }

      if (
        duplicateResults.length === 0 &&
        errorResults.length === 0 &&
        results.length > 0
      ) {
        const noIssuesLi = document.createElement("li");
        noIssuesLi.className = "text-muted mt-2";
        noIssuesLi.innerHTML = "Nenhuma nota duplicada ou com erro encontrada.";
        resultList.appendChild(noIssuesLi);
      }
    }
  };

  // --- Funções de processamento e importação ---
  const processarArquivo = async (file) => {
    try {
      const xmlText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject("Erro na leitura do arquivo");
        reader.readAsText(file);
      });

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      const getElementText = (parent, tags) => {
        let currentElement = parent;
        for (const tag of tags) {
          if (!currentElement) return null;
          currentElement = currentElement.getElementsByTagName(tag)[0];
        }
        return currentElement?.textContent?.trim() || null;
      };

      const infNFe = xmlDoc.getElementsByTagName("infNFe")[0];
      if (!infNFe) throw new Error("Tag <infNFe> não encontrada no XML.");

      const ide = infNFe.getElementsByTagName("ide")[0];
      const emit = infNFe.getElementsByTagName("emit")[0];
      const dest = infNFe.getElementsByTagName("dest")[0];
      const detElements = infNFe.getElementsByTagName("det");

      const chaveNFe =
        infNFe.getAttribute("Id")?.replace("NFe", "") ||
        getElementText(xmlDoc.getElementsByTagName("protNFe")[0], [
          "infProt",
          "chNFe",
        ]);
      const numeroNota = getElementText(ide, ["nNF"]);
      const dataEmissao = getElementText(ide, ["dhEmi"]);

      if (!chaveNFe || !numeroNota || !dataEmissao) {
        console.error("Campos essenciais faltando:", {
          chaveNFe,
          numeroNota,
          dataEmissao,
        });
        throw new Error(
          "XML inválido ou campos essenciais (chave, numero, data) faltando"
        );
      }

      const emitenteCNPJ = getElementText(emit, ["CNPJ"]);
      const emitenteNome = getElementText(emit, ["xNome"]);
      const emitenteUF = getElementText(emit, ["enderEmit", "UF"]);

      const destinatarioCPF = getElementText(dest, ["CPF"]);
      const destinatarioCNPJ = getElementText(dest, ["CNPJ"]);
      const destinatarioNome = getElementText(dest, ["xNome"]);
      const destinatarioUF = getElementText(dest, ["enderDest", "UF"]);

      const itens = [];
      for (let det of detElements) {
        const prodElement = det.getElementsByTagName("prod")[0];
        if (!prodElement) continue;
        const item = {
          ncm: getElementText(prodElement, ["NCM"]),
          descricao: getElementText(prodElement, ["xProd"]),
          quantidade: getElementText(prodElement, ["qCom"]),
          unidade: getElementText(prodElement, ["uCom"]),
        };
        itens.push(item);
      }

      if (itens.length === 0) {
        throw new Error("Nenhum item (<det>) encontrado na nota fiscal.");
      }

      // Definir unidadeGestora como "Axel" por padrão
      const unidadeGestora = "Axel";

      const requestBody = {
        chaveNFe,
        numeroNota,
        dataEmissao,
        emitenteCNPJ,
        emitenteNome,
        emitenteUF,
        destinatarioCNPJ: destinatarioCNPJ || destinatarioCPF,
        destinatarioNome,
        destinatarioUF,
        itens,
        xmlContent: xmlText, // O conteúdo XML bruto para armazenamento e auditoria
        unidadeGestora,
      };

      // Chamada real para a API
      const response = await fetch("/api/notas-fiscais/importar-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      // O back-end agora retornará o status com base na validação dos produtos
      return {
        filename: file.name,
        status:
          response.status === 409
            ? "duplicate"
            : response.ok
            ? result.status || "success"
            : "error",
        message: result.message || response.statusText || "Erro desconhecido",
      };
    } catch (error) {
      console.error("Erro ao processar arquivo:", file.name, error);
      return {
        filename: file.name,
        status: "error",
        message: error.message,
      };
    }
  };

  const handleImportar = async () => {
    const feedback = document.getElementById("feedback-message");
    const resultList = document.getElementById("result-list");
    const resultHeader = document.getElementById("result-header");
    const progressBar = document.getElementById("progress-bar");
    const fileInput = document.getElementById("xmlFile");

    if (
      !feedback ||
      !resultList ||
      !resultHeader ||
      !progressBar ||
      !fileInput
    ) {
      console.error("Elementos do DOM não encontrados em handleImportar");
      return;
    }
    if (!fileInput.files.length) return;

    try {
      feedback.classList.remove(
        "d-none",
        "alert-danger",
        "alert-light",
        "alert-warning"
      );
      feedback.classList.add("alert-info");
      resultHeader.classList.remove("d-none");
      resultList.innerHTML =
        '<li class="text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Processando...</li>';
      progressBar.style.width = "0%";
      progressBar.parentElement.classList.remove("d-none");

      const result = await processarArquivo(fileInput.files[0]);

      mostrarResultados([result]);
      progressBar.style.width = "100%";
    } catch (error) {
      console.error("Erro na importação (handleImportar):", error);
      feedback.classList.remove("alert-info");
      feedback.classList.add("alert-danger");
      resultHeader.classList.add("d-none");
      resultList.innerHTML = `<li><i class="fas fa-times-circle me-2"></i>Erro na importação: ${error.message}</li>`;
    } finally {
      if (fileInput) {
        fileInput.value = null;
      }
    }
  };

  const handleImportarPasta = async () => {
    const feedback = document.getElementById("feedback-message");
    const resultList = document.getElementById("result-list");
    const resultHeader = document.getElementById("result-header");
    const progressBar = document.getElementById("progress-bar");
    const folderInput = document.getElementById("xmlFolder");

    if (
      !feedback ||
      !resultList ||
      !resultHeader ||
      !progressBar ||
      !folderInput
    ) {
      console.error("Elementos do DOM não encontrados em handleImportarPasta");
      return;
    }
    if (!folderInput.files.length) return;

    try {
      feedback.classList.remove(
        "d-none",
        "alert-danger",
        "alert-light",
        "alert-warning"
      );
      feedback.classList.add("alert-info");
      resultHeader.classList.remove("d-none");
      resultList.innerHTML = `<li class="text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Processando ${folderInput.files.length} arquivos...</li>`;
      progressBar.style.width = "0%";
      progressBar.parentElement.classList.remove("d-none");

      const files = Array.from(folderInput.files);
      const results = [];
      let processed = 0;

      for (const file of files) {
        let result;
        if (
          file.type === "text/xml" ||
          file.name.toLowerCase().endsWith(".xml")
        ) {
          console.log(`Processando sequencialmente: ${file.name}`);
          result = await processarArquivo(file);
        } else {
          result = {
            filename: file.name,
            status: "error",
            message: "Arquivo não é XML",
          };
        }
        results.push(result);
        processed++;
        progressBar.style.width = `${(processed / files.length) * 100}%`;
      }

      mostrarResultados(results);
    } catch (error) {
      console.error("Erro na importação em pasta:", error);
      feedback.classList.remove("alert-info");
      feedback.classList.add("alert-danger");
      resultHeader.classList.add("d-none");
      resultList.innerHTML = `<li><i class="fas fa-times-circle me-2"></i>Erro na importação: ${error.message}</li>`;
    } finally {
      if (folderInput) {
        folderInput.value = null;
      }
    }
  };

  // Função para exibir um modal personalizado (substitui alert())
  const showCustomModal = (title, message) => {
    // Você precisará de uma estrutura modal HTML em seu main.html ou outro local global
    // Exemplo de estrutura básica no HTML:
    // <div class="modal fade" id="customAlertModal" tabindex="-1" aria-labelledby="customAlertModalLabel" aria-hidden="true">
    //   <div class="modal-dialog">
    //     <div class="modal-content">
    //       <div class="modal-header">
    //         <h5 class="modal-title" id="customAlertModalLabel"></h5>
    //         <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    //       </div>
    //       <div class="modal-body"></div>
    //       <div class="modal-footer">
    //         <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Ok</button>
    //       </div>
    //     </div>
    //   </div>
    // </div>

    const modalElement = document.getElementById("customAlertModal");
    if (modalElement) {
      modalElement.querySelector(".modal-title").textContent = title;
      modalElement.querySelector(".modal-body").textContent = message;
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    } else {
      // Fallback simples se o modal não for encontrado, mas o ideal é ter o modal HTML
      console.warn(
        "Modal customizado não encontrado. Exibindo alerta padrão:",
        message
      );
      alert(`${title}: ${message}`);
    }
  };

  // --- Listeners e Funções de Ciclo de Vida ---

  // Armazena referências aos listeners para poder removê-los depois.
  const listeners = [
    { el: "xmlFile", event: "change", handler: null },
    { el: "xmlFolder", event: "change", handler: null },
    { el: "btnImportar", event: "click", handler: handleImportar },
    { el: "btnImportarPasta", event: "click", handler: handleImportarPasta },
    { el: "btnTeste", event: "click", handler: handleTeste },
  ];

  const initEntradaNFE = () => {
    console.log("[EntradaNFE] Inicializando...");

    const clearLogs = () => {
      const feedbackMessage = document.getElementById("feedback-message");
      const resultList = document.getElementById("result-list");
      const resultHeader = document.getElementById("result-header");
      if (feedbackMessage && resultList && resultHeader) {
        feedbackMessage.classList.add("d-none");
        resultHeader.classList.add("d-none");
        resultList.innerHTML = "";
        const progressBar = document.getElementById("progress-bar");
        if (progressBar) {
          progressBar.style.width = "0%";
          progressBar.parentElement.classList.add("d-none");
        }
      }
    };

    // Atribui o handler de clearLogs para poder referenciá-lo na limpeza
    listeners.find(l => l.el === 'xmlFile').handler = clearLogs;
    listeners.find(l => l.el === 'xmlFolder').handler = clearLogs;

    listeners.forEach(listener => {
      const element = document.getElementById(listener.el);
      if (element) {
        element.addEventListener(listener.event, listener.handler);
      } else {
        console.warn(`[EntradaNFE] Elemento não encontrado: ${listener.el}`);
      }
    });

    // Adiciona estilos CSS para a borda e o ícone
    const styleId = "entrada-nfe-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .copyable-filename-container {
                position: relative;
                display: inline-block;
                border: 1px dashed #ccc;
                padding: 2px 20px 2px 5px;
                cursor: pointer;
                border-radius: 4px;
                transition: border-color 0.2s ease;
            }
            .copyable-filename-container:hover {
                border-color: #888;
            }
            .copy-icon {
                position: absolute;
                top: 50%;
                right: 5px;
                transform: translateY(-50%);
                font-size: 0.9em;
                color: #666;
                cursor: pointer;
                transition: color 0.2s ease;
            }
              .copyable-filename-container:hover .copy-icon {
                color: #000;
            }
        `;
        document.head.appendChild(style);
    }
    console.log("[EntradaNFE] Inicialização concluída.");
  };

  const cleanupEntradaNFE = () => {
    console.log("[EntradaNFE] Limpando listeners...");
    listeners.forEach(listener => {
      const element = document.getElementById(listener.el);
      if (element && typeof listener.handler === 'function') {
        element.removeEventListener(listener.event, listener.handler);
      }
    });

    const style = document.getElementById("entrada-nfe-styles");
    if (style) {
        style.remove();
    }
    console.log("[EntradaNFE] Limpeza concluída.");
  };

  // Expõe as funções para o escopo global para que o main.js possa chamá-las
  window.initEntradaNFE = initEntradaNFE;
  window.cleanupEntradaNFE = cleanupEntradaNFE;

})();
