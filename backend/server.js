const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
// Cria a instância do Express
const app = express();

// Importação de rotas
const notasFiscaisRoutes = require('./routes/notasFiscaisRoutes');
const lotesRoutes = require('./routes/lotesRoutes');
const classifcacaoNcmRoutes = require('./routes/classificacaoNcmRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const documentosRoutes = require('./routes/documentosRoutes');
const vendasRoutes = require('./routes/vendasRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const testeBancoRoute = require('./routes/testeBancoRoute'); // Restaurado
const notasFiscaisController = require('./controllers/notasFiscaisController');
const validarLoteVendasRoutes = require('./routes/validarLoteVendasRoutes'); 

// Middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend/")));


app.use(express.json()); // Para parsear JSON no body das requisições

// Configuração das rotas
app.use('/api/notas-fiscais', notasFiscaisRoutes);
app.use('/api/lotes', lotesRoutes); // Registra as rotas de lotes
app.use("/api", testeBancoRoute);
app.use("/api/clientes", clientesRoutes);
app.use("/api/documentos", documentosRoutes); // Adicione esta linha para montar as rotas de documentos
// Use as rotas de vendas
app.use('/api/vendas', vendasRoutes); // Rota principal para servir o frontend
// Use as rotas do dashboard (coloque-as antes das rotas de arquivos estáticos/wildcard)
app.use('/api/dashboard', dashboardRoutes);
// Use as rotas de validação de lotes de vendas
app.use('/api/validar-lote-vendas', validarLoteVendasRoutes); 

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/main.html"));
});

// Tratamento de erro genérico (opcional, mas recomendado)
app.use((err, req, res, next) => {
    console.error("Erro não tratado:", err.stack);
    res.status(500).send("Algo deu errado no servidor!");
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log("================================================");
    console.log(` Servidor rodando em: http://localhost:${PORT}`);
    console.log("================================================\n");
});
