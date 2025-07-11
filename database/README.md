5. Vá até a aba **Dump Options #1**:
- Desmarque "Only schema"
- Desmarque "Only data"
6. Clique em **Backup**.

---

## 🔁 Como Restaurar o Banco

### Usando pgAdmin

1. Crie um banco vazio chamado `gestao_estoque`.
2. Clique com o botão direito sobre ele > **Query Tool**.
3. Rode o comando:
```sql
\i 'CAMINHO_COMPLETO/gestao_estoque.sql';
