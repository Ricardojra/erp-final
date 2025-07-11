(() => {
  const vendaForm = document.getElementById("vendaForm");
  const feedback = document.getElementById("feedback");
  const itensVendidos = document.getElementById("itensVendidos");
  const addItemButton = document.getElementById("addItem");

  if (!vendaForm || !feedback || !itensVendidos || !addItemButton) {
    console.error("Elementos do formulário de venda não encontrados");
    return;
  }

  // Adicionar novo item
  addItemButton.addEventListener("click", () => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "item-vendido mb-3";
    itemDiv.innerHTML = `
        <div class="row">
          <div class="col-md-3">
            <label class="form-label">Item ID:</label>
            <input type="number" class="form-control item-id" required>
          </div>
          <div class="col-md-3">
            <label class="form-label">Quantidade Vendida:</label>
            <input type="number" step="0.01" class="form-control quantidade-vendida" required>
          </div>
          <div class="col-md-2">
            <label class="form-label">Unidade:</label>
            <select class="form-control unidade" required>
              <option value="TON">Tonelada</option>
              <option value="KG">Quilograma</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Valor Unitário (R$):</label>
            <input type="number" step="0.01" class="form-control valor-unitario" required>
          </div>
          <div class="col-md-1">
            <button type="button" class="btn btn-danger remove-item mt-4"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    itensVendidos.appendChild(itemDiv);
  });

  // Remover item
  itensVendidos.addEventListener("click", (e) => {
    if (e.target.closest(".remove-item") && itensVendidos.children.length > 1) {
      e.target.closest(".item-vendido").remove();
    }
  });

  vendaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedback.classList.add("d-none");

    const notaFiscalId = document.getElementById("notaFiscalId").value;
    const compradorCnpj = document
      .getElementById("compradorCnpj")
      .value.replace(/\D/g, "");
    const compradorNome = document.getElementById("compradorNome").value;
    const observacoes = document.getElementById("observacoes").value;

    const itens_vendidos = Array.from(
      itensVendidos.querySelectorAll(".item-vendido")
    ).map((item) => ({
      item_id: parseInt(item.querySelector(".item-id").value),
      quantidade_vendida: parseFloat(
        item.querySelector(".quantidade-vendida").value
      ),
      unidade: item.querySelector(".unidade").value,
                  valor_unitario_estimado: parseFloat(item.querySelector(".valor-unitario").value),
    }));

    try {
      const response = await fetch("/api/notas-fiscais/vender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota_fiscal_id: parseInt(notaFiscalId),
          itens_vendidos,
          comprador_cnpj: compradorCnpj || null,
          comprador_nome: compradorNome || null,
          observacoes: observacoes || null,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }

      feedback.classList.remove("d-none", "alert-danger");
      feedback.classList.add("alert-success");
      feedback.textContent = result.message;
      vendaForm.reset();
      itensVendidos.innerHTML = itensVendidos.children[0].outerHTML;
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      feedback.classList.remove("d-none", "alert-success");
      feedback.classList.add("alert-danger");
      feedback.textContent = `Erro: ${error.message}`;
    }
  });
})();
