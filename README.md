# ☕ App de Cardápio para Café

Um sistema completo de gerenciamento de pedidos para café com interface do cliente e painel do atendente em tempo real.

## 🎯 Funcionalidades

### Cliente
- ✅ Interface responsiva (funciona em smartphone)
- ✅ Seleção de itens por categoria
- ✅ Carrinho com ajuste de quantidade
- ✅ Preenchimento de dados (mesa, nome, telefone)
- ✅ Envio de pedido em tempo real

### Atendente
- ✅ Login com autenticação (usuário e senha)
- ✅ Dashboard em tempo real
- ✅ Atualização de status (pendente → preparando → pronto → entregue)
- ✅ Filtros por status
- ✅ Estatísticas de pedidos
- ✅ Notificação de novos pedidos

### Backend
- ✅ API REST com Express
- ✅ WebSocket (Socket.io) para atualizações em tempo real
- ✅ Banco de dados PostgreSQL
- ✅ Autenticação JWT
- ✅ Transações de banco de dados

## 🛠️ Tecnologias

- **Backend**: Node.js, Express, Socket.io, PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Autenticação**: JWT + bcryptjs
- **Comunicação**: HTTP + WebSocket

## 📋 Pré-requisitos

- Node.js 14+
- PostgreSQL 12+
- npm ou yarn

## 🚀 Instalação

### 1. Configurar Banco de Dados PostgreSQL

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Executar o script de criação
\i cafe-app-backend/config/database.sql

# Ou criar manualmente:
CREATE DATABASE cafe_app;

# Conectar ao banco
\c cafe_app;

# Criar tabelas (veja o arquivo database.sql para o script completo)
```

### 2. Instalar Dependências Backend

```bash
cd cafe-app-backend
npm install
```

### 3. Configurar Variáveis de Ambiente

Criar arquivo `.env` na pasta `cafe-app-backend`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=cafe_app

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui_2024
JWT_EXPIRE=7d
```

## 📱 Como Usar

### Iniciar o Servidor Backend

```bash
cd cafe-app-backend
npm start
# ou para desenvolvimento com auto-reload:
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

### Acessar Painel do Cliente

Abrir no navegador:
```
file:///C:/Users/lucas/Desktop/Projetos/café/frontend-cliente.html
```

Ou servir via HTTP (para melhor compatibilidade):
```bash
# Na pasta raiz do projeto
python -m http.server 8000
# Acessar: http://localhost:8000/frontend-cliente.html
```

### Acessar Painel do Atendente

Abrir no navegador:
```
file:///C:/Users/lucas/Desktop/Projetos/café/frontend-atendente.html
```

## 🔑 Credenciais de Teste

Para testar o painel do atendente, use:

**Username**: `admin`
**Password**: `admin123`

Você pode criar mais atendentes fazendo POST para `/api/auth/register`:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"atendente1","password":"senha123"}'
```

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login do atendente
- `POST /api/auth/register` - Registrar novo atendente

### Cardápio
- `GET /api/cardapio` - Listar todos os itens

### Pedidos
- `POST /api/pedidos` - Criar novo pedido (cliente)
- `GET /api/pedidos` - Listar todos os pedidos (atendente)
- `GET /api/pedidos/:id` - Obter detalhes do pedido
- `PATCH /api/pedidos/:id/status` - Atualizar status

## 🗄️ Estrutura do Banco de Dados

### Tabelas

**users** - Atendentes
```sql
id (PK), username, password_hash, created_at
```

**cardapio** - Itens do menu
```sql
id (PK), nome, descricao, preco, categoria, ativo, created_at
```

**pedidos** - Pedidos de clientes
```sql
id (PK), mesa, cliente_nome, cliente_telefone, status, total, created_at, updated_at
```

**itens_pedido** - Itens dentro de cada pedido
```sql
id (PK), pedido_id (FK), cardapio_id (FK), quantidade, preco_unitario
```

## 🔄 Fluxo de Funcionamento

1. **Cliente acessa** `frontend-cliente.html`
2. **Preenche** número da mesa, nome e telefone
3. **Seleciona itens** do cardápio
4. **Revisa carrinho** e clica em "Enviar Pedido"
5. **Backend recebe** o pedido e salva no BD
6. **Socket.io emite** o novo pedido para todos os atendentes conectados
7. **Atendente vê** o novo pedido no painel em tempo real
8. **Atendente atualiza** o status do pedido (pendente → preparando → pronto → entregue)
9. **Cliente recebe** notificação de atualização (opcional: adicionar Socket.io no cliente)

## ⚙️ Configuração Avançada

### Mudar Porta do Servidor

Editar `.env`:
```env
PORT=4000
```

### Adicionar mais Itens ao Cardápio

Editar `config/database.sql` - seção de INSERT em `cardapio`, ou:

```bash
curl -X POST http://localhost:3000/api/cardapio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_ATENDENTE}" \
  -d '{
    "nome": "Café Duplo",
    "descricao": "Dois expressos",
    "preco": 6.50,
    "categoria": "Bebidas"
  }'
```

### Conectar de Outro Dispositivo

1. Descobrir IP do servidor:
   - Windows: `ipconfig` (procurar IPv4)
   - Linux/Mac: `ifconfig`

2. Acessar no cliente/atendente:
   ```
   http://{SEU_IP}:3000/frontend-cliente.html
   http://{SEU_IP}:3000/frontend-atendente.html
   ```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'pg'"
```bash
npm install pg bcryptjs jsonwebtoken dotenv socket.io
```

### Erro: "Conexão recusada" no PostgreSQL
- Verificar se PostgreSQL está rodando
- Confirmar host, port, user, password em `.env`

### Erro: "CORS error"
- O frontend está em um arquivo local (file://)
- Solução: Servir via HTTP server (veja seção "Como Usar")

### Painel do atendente não recebe atualizações
- Verificar se Socket.io está conectando
- Abrir DevTools (F12) e ver console
- Confirmar que o backend está rodando

## 📝 Customizações Sugeridas

1. **Adicionar fotos** dos itens do cardápio
2. **Integrar sistema de pagamento** (após consumo)
3. **Histórico de pedidos** por cliente
4. **Relatórios** de vendas
5. **Notificações** para cliente (SMS, WhatsApp)
6. **App mobile** nativa (React Native, Flutter)
7. **Temas** personalizáveis por café
8. **Múltiplas mesas** e printers

## 📞 Suporte

Para dúvidas ou sugestões, verificar documentação do:
- Express: https://expressjs.com
- Socket.io: https://socket.io
- PostgreSQL: https://www.postgresql.org

---

**Versão**: 1.0.0  
**Status**: ✅ Pronto para uso
