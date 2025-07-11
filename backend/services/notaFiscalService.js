const db = require("../config/dbConfig.js"); // Importa a instância do sqlite3

/**
 * Consulta notas fiscais por uma lista de números usando SQLite.
 * @param {string[]} numerosNotas - Array de números das notas fiscais a consultar.
 * @returns {Promise<{notas_encontradas: Array, notas_nao_encontradas: string[]}>} Objeto com notas encontradas e números não encontrados.
 */
const consultarNotasPorNumeros = async (numerosNotas) => {
  console.log(
    "[Service Test] Consultando notas por números (SQLite):",
    numerosNotas
  );
  return new Promise((resolve, reject) => {
    if (!numerosNotas || numerosNotas.length === 0) {
      return resolve({ notas_encontradas: [], notas_nao_encontradas: [] });
    }

    const placeholders = numerosNotas.map(() => "?").join(",");
    const sql = `
      SELECT 
        id, 
        numero_nota, 
        status, 
        unidade_gestora 
      FROM notas_fiscais 
      WHERE numero_nota IN (${placeholders});
    `;

    console.log(
      `[Service Test] Executando SQL: ${sql} com params:`,
      numerosNotas
    );
    db.all(sql, numerosNotas, (err, rows) => {
      if (err) {
        console.error(
          "[Service Test] Erro ao consultar notas por números no SQLite:",
          err
        );
        return reject(
          new Error("Erro ao consultar notas fiscais no banco de dados.")
        );
      }
      console.log(`[Service Test] Consulta retornou ${rows.length} notas.`);
      const numerosEncontrados = new Set(rows.map((row) => row.numero_nota));
      const notasNaoEncontradas = numerosNotas.filter(
        (num) => !numerosEncontrados.has(num)
      );
      resolve({
        notas_encontradas: rows,
        notas_nao_encontradas: notasNaoEncontradas,
      });
    });
  });
};

/**
 * Atualiza o status de múltiplas notas fiscais em lote usando SQLite.
 * @param {string[]} numerosNotas - Array de números das notas fiscais a atualizar.
 * @param {string} novoStatus - Novo status a ser aplicado.
 * @returns {Promise<{success: boolean, message: string, affectedCount: number, errors: string[]}>} Resultado da operação.
 */
const atualizarStatusLote = async (numerosNotas, novoStatus) => {
  console.log(
    `[Service Test] Atualizando status em lote (SQLite) para '${novoStatus}'. Notas:`,
    numerosNotas
  );
  return new Promise((resolve, reject) => {
    if (!numerosNotas || numerosNotas.length === 0 || !novoStatus) {
      return reject(
        new Error("Números das notas e novo status são obrigatórios.")
      );
    }

    const statusPermitidos = [
      "disponivel",
      "enviada",
      "vendida",
      "reprovada",
      "pendente",
      "ofertada",
    ];
    if (!statusPermitidos.includes(novoStatus)) {
      return reject(
        new Error(
          `Status inválido: ${novoStatus}. Status permitidos: ${statusPermitidos.join(
            ", "
          )}`
        )
      );
    }

    const placeholdersNumeros = numerosNotas.map(() => "?").join(",");
    const sql = `
      UPDATE notas_fiscais 
      SET status = ? 
      WHERE numero_nota IN (${placeholdersNumeros});
    `;

    const params = [novoStatus, ...numerosNotas];

    console.log(`[Service Test] Executando SQL: ${sql} com params:`, params);
    db.run(sql, params, function (err) {
      if (err) {
        console.error(
          "[Service Test] Erro ao atualizar status em lote no SQLite:",
          err
        );
        return reject(
          new Error(`Falha ao atualizar status no banco: ${err.message}`)
        );
      }
      console.log(
        `[Service Test] Update result: ${this.changes} linhas afetadas.`
      );
      if (this.changes === 0) {
        console.warn("[Service Test] Nenhuma linha foi atualizada.");
      }
      resolve({
        success: true,
        message: `${this.changes} nota(s) fiscal(is) tiveram o status atualizado para '${novoStatus}'.`,
        affectedCount: this.changes,
        errors: [],
      });
    });
  });
};

/**
 * Lista notas fiscais elegíveis para envio.
 * @returns {Promise<Array>} Array de notas fiscais com status elegíveis.
 */
const listarNotasParaEnvio = async () => {
  console.log("[Service Test] Listando notas para envio ...");
  return new Promise((resolve, reject) => {
    const statusElegiveis = ["disponivel", "pendente", "ofertada"];
    const placeholders = statusElegiveis.map(() => "?").join(",");
    const sql = `
      SELECT id, numero_nota, data_emissao, emitente_nome, status 
      FROM notas_fiscais 
      WHERE status IN (${placeholders}) 
      ORDER BY data_emissao DESC, id DESC;
    `;
    db.all(sql, statusElegiveis, (err, rows) => {
      if (err) {
        console.error(
          "[Service Test] Erro ao buscar notas para envio no SQLite:",
          err
        );
        return reject(
          new Error("Erro ao buscar notas fiscais no banco de dados.")
        );
      }
      resolve(rows);
    });
  });
};

/**
 * Marca uma nota fiscal como enviada, permitindo transição a partir de status específicos.
 * @param {number} id - ID da nota fiscal.
 * @returns {Promise<number>} Número de linhas afetadas.
 */
const marcarComoEnviada = async (id) => {
  console.log(`[Service Test] Marcando nota ID ${id} como enviada ...`);
  return new Promise((resolve, reject) => {
    const statusPermitidosParaEnvio = ["disponivel", "pendente", "ofertada"];
    const placeholders = statusPermitidosParaEnvio.map(() => "?").join(",");
    const sql = `
      UPDATE notas_fiscais 
      SET status = ? 
      WHERE id = ? AND status IN (${placeholders});
    `;
    const params = ["enviada", id, ...statusPermitidosParaEnvio];

    db.run(sql, params, function (err) {
      if (err) {
        console.error(
          `[Service Test] Erro ao marcar nota ${id} como enviada no SQLite:`,
          err
        );
        return reject(new Error("Erro ao atualizar status da nota fiscal."));
      }
      if (this.changes === 0) {
        db.get(
          "SELECT status FROM notas_fiscais WHERE id = ?",
          [id],
          (findErr, row) => {
            if (findErr)
              return reject(
                new Error("Erro ao verificar status da nota fiscal.")
              );
            if (!row) return reject(new Error("Nota fiscal não encontrada."));
            if (!statusPermitidosParaEnvio.includes(row.status)) {
              return reject(
                new Error(
                  `Nota fiscal está com status '${row.status}', que não permite envio.`
                )
              );
            }
            return reject(
              new Error("Nota fiscal não encontrada ou já processada.")
            );
          }
        );
      } else {
        resolve(this.changes);
      }
    });
  });
};

module.exports = {
  consultarNotasPorNumeros,
  atualizarStatusLote,
  listarNotasParaEnvio,
  marcarComoEnviada,
};
