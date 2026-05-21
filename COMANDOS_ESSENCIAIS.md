# ⚡ Comandos Essenciais & Referência Rápida

## 🚀 Iniciar o App

### 1. Configurar Banco de Dados (primeira vez)

```bash
# Conectar ao PostgreSQL
psql -U postgres

# No prompt do PostgreSQL:
CREATE DATABASE cafe_app;
\c cafe_app
\i 'C:/Users/lucas/Desktop/Projetos/café/SETUP_DATABASE.sql'

# Verificar se funcionou:
\dt  # Ver tabelas
SELECT COUNT(*) FROM cardapio;  # Ver itens
```

### 2. Iniciar Backend

```bash
cd C:/Users/lucas/Desktop/Projetos/café/cafe-app-backend
npm start
```

**Esperado:**
```
☕ Servidor rodando na porta 3000
📍 Cardápio: http://localhost:3000/api/cardapio
🔑 Login: POST http://localhost:3000/api/auth/login
```

### 3. Abrir Frontends

**Cliente** (em nova aba do navegador):
```
file:///C:/Users/lucas/Desktop/Projetos/café/frontend-cliente.html
```

**Atendente** (em nova aba do navegador):
```
file:///C:/Users/lucas/Desktop/Projetos/café/frontend-atendente.html
```

Login: `admin` / `admin123`

---

## 🔍 Verificações Rápidas

### Checklist de Status

```bash
# Verificar se PostgreSQL está rodando
psql -U postgres -c "SELECT NOW();"

# Verificar se Node.js está rodando
netstat -an | find "3000"  # Windows
lsof -i :3000              # Linux/Mac

# Verificar banco de dados
psql -U postgres -d cafe_app -c "\dt"

# Contar registros
psql -U postgres -d cafe_app -c "SELECT COUNT(*) FROM cardapio;"
psql -U postgres -d cafe_app -c "SELECT COUNT(*) FROM pedidos;"
```

### Testar API

```bash
# Testar cardápio
curl http://localhost:3000/api/cardapio

# Testar login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Testar criar pedido
curl -X POST http://localhost:3000/api/cardapio \
  -H "Content-Type: application/json" \
  -d '{
    "mesa": 1,
    "cliente_nome": "Test",
    "cliente_telefone": "1199999999",
    "itens": [{"cardapio_id": 1, "quantidade": 1}]
  }'
```

---

## 🔐 Gerenciar Atendentes

### Criar Novo Atendente

**Opção 1: Via API**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"joao","password":"senha123"}'
```

**Opção 2: SQL (inserir hash manualmente)**
```bash
# Gerar hash bcrypt (usar terminal Node.js)
node -e "console.log(require('bcryptjs').hashSync('senha123', 10))"

# Copiar o hash e inserir:
psql -U postgres -d cafe_app -c \
  "INSERT INTO users (username, password_hash) VALUES ('joao', '{HASH_AQUI}');"
```

### Listar Atendentes

```bash
psql -U postgres -d cafe_app -c "SELECT id, username FROM users;"
```

### Deletar Atendente

```bash
psql -U postgres -d cafe_app -c "DELETE FROM users WHERE username = 'joao';"
```

---

## 🍽️ Gerenciar Cardápio

### Ver Todos os Itens

```bash
psql -U postgres -d cafe_app -c "SELECT * FROM cardapio ORDER BY categoria;"
```

### Adicionar Item

**Opção 1: SQL Direto**
```bash
psql -U postgres -d cafe_app -c \
  "INSERT INTO cardapio (nome, descricao, preco, categoria) 
   VALUES ('Café Gelado', 'Café gelado com gelo', 5.50, 'Bebidas');"
```

**Opção 2: Via API**
```bash
# Primeiro fazer login para pegar token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Depois criar item
curl -X POST http://localhost:3000/api/cardapio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nome": "Café Gelado",
    "descricao": "Café gelado com gelo",
    "preco": 5.50,
    "categoria": "Bebidas"
  }'
```

### Desativar Item

```bash
psql -U postgres -d cafe_app -c \
  "UPDATE cardapio SET ativo = FALSE WHERE id = 5;"
```

---

## 📋 Gerenciar Pedidos

### Ver Todos os Pedidos

```bash
psql -U postgres -d cafe_app -c \
  "SELECT id, mesa, cliente_nome, status, total, created_at 
   FROM pedidos ORDER BY created_at DESC;"
```

### Ver Detalhes de um Pedido

```bash
psql -U postgres -d cafe_app -c \
  "SELECT p.*, json_agg(json_build_object('nome', c.nome, 'qty', ip.quantidade)) 
   FROM pedidos p 
   LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id 
   LEFT JOIN cardapio c ON ip.cardapio_id = c.id 
   WHERE p.id = 1 
   GROUP BY p.id;"
```

### Atualizar Status (sem usar painel)

```bash
# Primeiro pegar token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Depois atualizar
curl -X PATCH http://localhost:3000/api/pedidos/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"pronto"}'
```

### Deletar Pedido

```bash
psql -U postgres -d cafe_app -c "DELETE FROM pedidos WHERE id = 5;"
```

---

## 🧹 Limpeza & Manutenção

### Limpar Banco de Dados (CUIDADO!)

```bash
# Deletar todos os pedidos (mantém cardápio e usuários)
psql -U postgres -d cafe_app -c "TRUNCATE TABLE itens_pedido CASCADE; TRUNCATE TABLE pedidos;"

# Resetar IDs
psql -U postgres -d cafe_app -c \
  "ALTER SEQUENCE pedidos_id_seq RESTART WITH 1; 
   ALTER SEQUENCE itens_pedido_id_seq RESTART WITH 1;"
```

### Resetar Banco Completamente

```bash
# Dropa e recria o banco
psql -U postgres -c "DROP DATABASE IF EXISTS cafe_app;"
psql -U postgres -c "CREATE DATABASE cafe_app;"
psql -U postgres -d cafe_app -f SETUP_DATABASE.sql
```

### Ver Tamanho do Banco

```bash
psql -U postgres -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datname = 'cafe_app';"
```

---

## 🐛 Debug & Troubleshooting

### Ver Logs do Servidor

```bash
# O servidor mostra logs no console
# Para mais detalhes, editar server.js e adicionar console.log()

# Exemplo: Ver todas as requisições
# Adicionar middleware:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Verificar Conexão do Banco

```bash
# Conectar direto
psql -U postgres -d cafe_app

# Rodar query de teste
SELECT 1;

# Sair
\q
```

### Ver Logs do PostgreSQL

```bash
# Em Windows (se PostgreSQL foi instalado via instalador)
type "C:\Program Files\PostgreSQL\14\data\log\*"

# Em Linux
tail -f /var/lib/postgresql/data/log/postgresql.log
```

### Resetar Senha PostgreSQL

```bash
# Se esqueceu a senha do postgres
# No Windows, editar pg_hba.conf e mudar autenticação para 'trust'
# Depois reconectar
psql -U postgres

# Dentro do psql:
ALTER USER postgres WITH PASSWORD 'nova_senha';
```

---

## 📊 Comandos Úteis do PostgreSQL

```bash
# Ver todas as tabelas
\dt

# Ver estrutura de uma tabela
\d cardapio

# Ver índices
\di

# Ver conexões ativas
SELECT * FROM pg_stat_activity;

# Ver tamanho de tabelas
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Exportar dados
\copy (SELECT * FROM pedidos) TO 'pedidos_export.csv' WITH CSV HEADER;

# Importar dados
\copy cardapio FROM 'cardapio_import.csv' WITH CSV HEADER;

# Fazer backup
pg_dump -U postgres -d cafe_app -F c -b -v -f cafe_app_backup.dump

# Restaurar backup
pg_restore -U postgres -d cafe_app -v cafe_app_backup.dump
```

---

## 🔄 Workflow do Desenvolvimento

### Fazer Mudanças

```bash
# 1. Editar arquivo (ex: server.js)
vim server.js

# 2. Parar servidor atual (Ctrl+C no terminal)

# 3. Reiniciar
npm start

# 4. Testar mudanças
curl http://localhost:3000/api/cardapio
```

### Adicionar Nova Rota

```bash
# 1. Editar server.js
app.get('/api/nova-rota', (req, res) => {
  res.json({ message: 'Nova rota!' });
});

# 2. Reiniciar servidor
# 3. Testar
curl http://localhost:3000/api/nova-rota
```

### Adicionar Nova Coluna no Banco

```bash
# 1. Fazer backup
pg_dump -U postgres -d cafe_app > backup_antes.sql

# 2. Adicionar coluna
psql -U postgres -d cafe_app -c \
  "ALTER TABLE pedidos ADD COLUMN observacoes TEXT;"

# 3. Atualizar código para usar nova coluna
```

---

## 📞 Contatos Úteis

### Documentação
- Express: https://expressjs.com
- Socket.io: https://socket.io
- PostgreSQL: https://www.postgresql.org
- Node.js: https://nodejs.org

### Ferramentas
- pgAdmin: https://www.pgadmin.org (interface gráfica para PostgreSQL)
- Postman: https://www.postman.com (testar APIs)
- DBeaver: https://dbeaver.io (gerenciar banco de dados)

### Atalhos Úteis (Linux/Mac)
```bash
Ctrl+C = Parar servidor
Ctrl+L = Limpar tela
clear = Limpar tela
history = Ver histórico
```

---

**Última atualização**: 2024  
**Versão**: 1.0.0
