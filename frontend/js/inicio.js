// frontend/js/inicio.js

// Remova o evento DOMContentLoaded, o main.js irá chamar esta função diretamente
// document.addEventListener("DOMContentLoaded", () => {
initCalculadoraAmbiental();
   const btnAtualizarImpacto = document.getElementById("btnAtualizarImpacto");
  if (btnAtualizarImpacto) {
         btnAtualizarImpacto.addEventListener("click", initCalculadoraAmbiental);
   }

  const FATORES_IMPACTO = {
  // ... (seus fatores de impacto)
  metal: {
    co2_evitado_kg: 10,
    agua_poupada_litros: 100,
    energia_economizada_kwh: 14,
    residuos_desviados_kg: 1,
    resources_preservados_unidades: 0.005,
  },
  papel: {
    co2_evitado_kg: 1.2,
    agua_poupada_litros: 17,
    energia_economizada_kwh: 4,
    residuos_desviados_kg: 1,
    resources_preservados_unidades: 0.015,
  },
  papelão: {
    co2_evitado_kg: 1.0,
    agua_poupada_litros: 15,
    energia_economizada_kwh: 3.5,
    residuos_desviados_kg: 1,
    resources_preservados_unidades: 0.012,
  },
  plásticos: {
    co2_evitado_kg: 1.5,
    agua_poupada_litros: 20,
    energia_economizada_kwh: 5.5,
    residuos_desviados_kg: 1,
    resources_preservados_unidades: 0.002,
  },
  vidro: {
    co2_evitado_kg: 0.3,
    agua_poupada_litros: 0.5,
    energia_economizada_kwh: 0.5,
    residuos_desviados_kg: 1,
    resources_preservados_unidades: 0.001,
  },
  cobre: {
    co2_evitado_kg: 2,
    agua_poupada_litros: 5,
    energia_economizada_kwh: 2,
    residuos_desviados_kg: 1,
    resources_preservados_unidades: 0.003,
  },
  sucata: {
    co2_evitado_kg: 0.8,
    agua_poupada_litros: 8,
    energia_economizada_kwh: 3,
    residuos_desviados_kg: 1,
    resources_preservados_unidades: 0.001,
  },
};

// ... (seus FATORES_IMPACTO aqui)

// frontend/js/inicio.js

// ... (seus FATORES_IMPACTO e outras funções anteriores aqui)

let impactoChart = null;
let materiaisChart = null;

// Função para renderizar o gráfico de pizza de contribuição por material
function renderizarGraficoContribuicao(materiaisData) {
    const ctx = document.getElementById('graficoContribuicao')?.getContext('2d');
    if (!ctx) {
        console.error('Elemento canvas para o gráfico de contribuição não encontrado.');
        return;
    }

    if (window.graficoContribuicao instanceof Chart) {
        window.graficoContribuicao.destroy();
    }

    const labels = materiaisData.map(m => m.material);
    const data = materiaisData.map(m => m.quantidade);

    window.graficoContribuicao = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Contribuição por Material (kg)',
                data: data,
                backgroundColor: [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
                    '#858796', '#5a5c69', '#f8f9fc', '#b3d1ff', '#e6f5ff'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: false
                }
            }
        }
    });
}

// Função para renderizar o gráfico de barras de impacto total
function renderizarGraficoImpactoTotal(totais) {
    const ctx = document.getElementById('graficoImpactoTotal')?.getContext('2d');
    if (!ctx) {
        console.error('Elemento canvas para o gráfico de impacto total não encontrado.');
        return;
    }

    if (window.graficoImpactoTotal instanceof Chart) {
        window.graficoImpactoTotal.destroy();
    }

    // Usamos um fator de escala para normalizar os dados para melhor visualização
    const dadosParaGrafico = {
        'CO² Evitado (Ton)': totais.co2 / 1000,
        'Água Poupada (kL)': totais.agua / 1000,
        'Energia (MWh)': totais.energia / 1000,
    };

    window.graficoImpactoTotal = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(dadosParaGrafico),
            datasets: [{
                label: 'Impacto Ambiental Total',
                data: Object.values(dadosParaGrafico),
                backgroundColor: ['#1cc88a', '#4e73df', '#f6c23e'],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000) + 'M';
                            if (value >= 1000) return (value / 1000) + 'k';
                            return value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

export async function initCalculadoraAmbiental() {
  console.log("Calculadora Ambiental: Iniciando cálculo de impactos...");
  const feedbackDiv = document.getElementById("feedback-calculadora");
  if (feedbackDiv) {
    feedbackDiv.classList.add("d-none"); // Esconde feedback anterior
  }

  try {
    const response = await fetch(
      "/api/notas-fiscais/materiais-vendidos-calculadora"
    );
    const data = await response.json();

    if (data.success) {
      const materiaisVendidos = data.materiaisVendidos;
      console.log(
        "[Calculadora] Materiais vendidos recebidos do backend:",
        materiaisVendidos
      );

      let totalCo2Evitado = 0;
      let totalAguaPoupada = 0;
      let totalEnergiaEconomizada = 0;
      let totalResiduosDesviados = 0;
      let totalRecursosPreservados = 0;
      const contribuicaoPorMaterial = [];

      materiaisVendidos.forEach((item) => {
        const materialKey = item.material ? item.material.toLowerCase() : null;
        const quantidade = parseFloat(item.total_quantidade_vendida);

        console.log(
          `[Calculadora] Processando item: Material='${item.material}' (key='${materialKey}'), Quantidade='${item.total_quantidade_vendida}' (parsed=${quantidade})`
        );

        if (materialKey && FATORES_IMPACTO[materialKey] && !isNaN(quantidade)) {
          const fatores = FATORES_IMPACTO[materialKey];
          console.log(
            `[Calculadora] Fatores encontrados para '${materialKey}':`,
            fatores
          );
          console.log(
            `[Calculadora] Cálculo para '${materialKey}': ${quantidade} * ${
              fatores.co2_evitado_kg
            } = ${quantidade * fatores.co2_evitado_kg}`
          );

          totalCo2Evitado += quantidade * fatores.co2_evitado_kg;
          totalAguaPoupada += quantidade * fatores.agua_poupada_litros;
          totalEnergiaEconomizada +=
            quantidade * fatores.energia_economizada_kwh;
          totalResiduosDesviados += quantidade * fatores.residuos_desviados_kg;
          totalRecursosPreservados +=
            quantidade * fatores.resources_preservados_unidades;
            
          // Adiciona dados para o gráfico de contribuição
          contribuicaoPorMaterial.push({ material: item.material, quantidade: quantidade });
        } else {
          console.warn(
            `[Calculadora] IGNORADO: Fatores de impacto não encontrados para o material: '${materialKey}' OU quantidade inválida: ${quantidade}.`
          );
        }
      });

      console.log("[Calculadora] Totais Calculados:");
      console.log("  CO2 Evitado:", totalCo2Evitado);
      console.log("  Água Poupada:", totalAguaPoupada);
      console.log("  Energia Economizada:", totalEnergiaEconomizada);
      console.log("  Resíduos Desviados:", totalResiduosDesviados);
      console.log("  Recursos Preservados:", totalRecursosPreservados);

      // --- INÍCIO DAS MUDANÇAS PARA FORMATAR OS NÚMEROS COM PONTO DE MILHAR ---

      // Função auxiliar para formatar números de forma mais amigável
      const formatNumberForDisplay = (num, originalUnit) => {
        let value = num;
        let displayUnit = originalUnit;
        let decimalPlaces = 2; // Padrão para 2 casas decimais

        // Conversões iniciais para unidades maiores
        if (originalUnit === 'kg') { // CO2 e Resíduos
            value = num / 1000; // kg para Toneladas
            displayUnit = 'Ton';
        } else if (originalUnit === 'Litros') { // Água
            value = num / 1000; // Litros para kilolitros
            displayUnit = 'kL';
        } else if (originalUnit === 'kWh') { // Energia
            value = num / 1000; // kWh para MWh
            displayUnit = 'MWh';
        }
        // 'unidades' permanece como está

        // Lógica para abreviação (Bilhões, Milhões, Milhares) sobre o valor JÁ CONVERTIDO
        // E definição das casas decimais
        if (value >= 1_000_000_000) { // Bilhões
            decimalPlaces = (value % 1_000_000_000 === 0) ? 0 : 2;
            value = value / 1_000_000_000;
            displayUnit = `Bilhões ${displayUnit}`;
        } else if (value >= 1_000_000) { // Milhões
            decimalPlaces = (value % 1_000_000 === 0) ? 0 : 2;
            value = value / 1_000_000;
            displayUnit = `Milhões ${displayUnit}`;
        } else if (value >= 1_000 && originalUnit === 'unidades') {
            // Apenas para 'unidades', convertemos para 'Mil' se for > 1000
            decimalPlaces = (value % 1_000 === 0) ? 0 : 2;
            value = value / 1_000;
            displayUnit = `Mil ${displayUnit}`;
        } else {
             // Ajusta casas decimais para valores menores
             if (value % 1 === 0) { // Se for um número inteiro
                 decimalPlaces = 0;
             } else if (value < 10 && value !== 0) { // Pequenos, mais precisão
                 decimalPlaces = 3;
             } else if (value < 100 && value !== 0) { // Médios
                 decimalPlaces = 2;
             } else { // Grandes, mas que não atingem Mil/Milhões/Bilhões
                 decimalPlaces = 1;
             }
        }

        // Formata o número usando Intl.NumberFormat para o locale 'pt-BR'
        // que usa ponto para milhares e vírgula para decimal.
        const formatter = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
            useGrouping: true // Garante o separador de milhar
        });

        return `${formatter.format(value)} ${displayUnit}`;
      };

      // Atualiza o HTML com os resultados formatados
      const impactoCo2Element = document.getElementById("impacto-co2");
      if (impactoCo2Element) impactoCo2Element.innerText = formatNumberForDisplay(totalCo2Evitado, 'kg');

      const impactoAguaElement = document.getElementById("impacto-agua");
      if (impactoAguaElement) impactoAguaElement.innerText = formatNumberForDisplay(totalAguaPoupada, 'Litros');

      const impactoEnergiaElement = document.getElementById("impacto-energia");
      if (impactoEnergiaElement) impactoEnergiaElement.innerText = formatNumberForDisplay(totalEnergiaEconomizada, 'kWh');

      const residuosDesviadosElement = document.getElementById("residuos-desviados");
      if (residuosDesviadosElement) residuosDesviadosElement.innerText = formatNumberForDisplay(totalResiduosDesviados, 'kg');

      const recursosPreservadosElement = document.getElementById("recursos-preservados");
      if (recursosPreservadosElement) recursosPreservadosElement.innerText = formatNumberForDisplay(totalRecursosPreservados, 'unidades');

      // --- FIM DAS MUDANÇAS ---

      // Renderizar os gráficos
      renderizarGraficoContribuicao(contribuicaoPorMaterial);
      renderizarGraficoImpactoTotal({
          co2: totalCo2Evitado,
          agua: totalAguaPoupada,
          energia: totalEnergiaEconomizada
      });

      if (feedbackDiv) {
        feedbackDiv.classList.remove("alert-danger", "alert-info");
        feedbackDiv.classList.add("alert-success");
        feedbackDiv.innerText =
          "Cálculo de impacto ambiental atualizado com sucesso!";
        feedbackDiv.classList.remove("d-none");
      }
    } else {
      console.error("Erro ao carregar dados da calculadora:", data.message);
      if (feedbackDiv) {
        feedbackDiv.classList.remove("alert-success", "alert-info");
        feedbackDiv.classList.add("alert-danger");
        feedbackDiv.innerText =
          data.message || "Erro ao carregar dados da calculadora.";
        feedbackDiv.classList.remove("d-none");
      }
    }
  } catch (error) {
    console.error("Erro na requisição da calculadora ambiental:", error);
    if (feedbackDiv) {
      feedbackDiv.classList.remove("alert-success", "alert-info");
      feedbackDiv.classList.add("alert-danger");
      feedbackDiv.innerText =
        "Erro ao conectar com o servidor para calcular impactos.";
      feedbackDiv.classList.remove("d-none");
    }
  }
}