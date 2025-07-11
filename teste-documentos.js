// Script de teste para verificar as rotas de documentos
const API_BASE_URL = "http://localhost:3000";

async function testarRotasDocumentos() {
    console.log("=== TESTE DAS ROTAS DE DOCUMENTOS ===");
    
    try {
        // Teste 1: Buscar tipos de documento
        console.log("\n1. Testando GET /api/documentos/tipos-documento");
        const response1 = await fetch(`${API_BASE_URL}/api/documentos/tipos-documento`);
        console.log(`Status: ${response1.status}`);
        if (response1.ok) {
            const data1 = await response1.json();
            console.log("✅ Tipos de documento carregados:", data1);
        } else {
            console.log("❌ Erro ao buscar tipos de documento");
        }

        // Teste 2: Buscar documentos
        console.log("\n2. Testando GET /api/documentos");
        const response2 = await fetch(`${API_BASE_URL}/api/documentos`);
        console.log(`Status: ${response2.status}`);
        if (response2.ok) {
            const data2 = await response2.json();
            console.log("✅ Documentos carregados:", data2);
        } else {
            console.log("❌ Erro ao buscar documentos");
        }

        // Teste 3: Buscar clientes
        console.log("\n3. Testando GET /api/clientes");
        const response3 = await fetch(`${API_BASE_URL}/api/clientes`);
        console.log(`Status: ${response3.status}`);
        if (response3.ok) {
            const data3 = await response3.json();
            console.log("✅ Clientes carregados:", data3);
        } else {
            console.log("❌ Erro ao buscar clientes");
        }

    } catch (error) {
        console.error("❌ Erro geral:", error);
    }
}

// Executar o teste
testarRotasDocumentos(); 