# 📐 Arquitetura do Sistema

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                          CLIENTES                             │
├─────────────────────────────────────────────────────────────┤
│  Smartphones/Tablets   │   Computadores       │   Atendentes   │
│  (frontend-cliente)    │                      │ (frontend-...)  │
│  - Cardápio            │                      │  - Dashboard    │
│  - Carrinho            │                      │  - Controle     │
│  - Pedido              │                      │  - Status       │
└─────────┬──────────────────────────────────┬──────────────────┘
          │                                  │
          │ HTTP + WebSocket                 │ HTTP + WebSocket
          │                                  │
┌─────────▼──────────────────────────────────▼──────────────────┐
│                    BACKEND SERVER (Node.js)                    │
├───────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Express Server - Port 3000                             │  │
│  │  ├─ REST API (/api/*)                                   │  │
│  │  ├─ Socket.io (WebSocket)                               │  │
│  │  └─ CORS Middleware                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Autenticação & Segurança                               │  │
│  │  ├─ JWT (JSON Web Token)                                │  │
│  │  ├─ bcryptjs (Hash de senhas)                           │  │
│  │  └─ Middleware de autenticação                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Routes & Endpoints                                     │  │
│  │  ├─ /api/auth/* (Login, Register)                       │  │
│  │  ├─ /api/cardapio/* (Cardápio)                          │  │
│  │  └─ /api/pedidos/* (Pedidos)                            │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────────┘
                      │ TCP Connection
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                 PostgreSQL Database                             │
├───────────────────────────────────────────────────────────────┤
│  Database: cafe_app                                             │
│                                                                 │
│  Tables:                                                        │
│  ├─ users (id, username, password_hash)                        │
│  ├─ cardapio (id, nome, preco, categoria)                      │
│  ├─ pedidos (id, mesa, cliente_*, status, total)               │
│  └─ itens_pedido (id, pedido_id, cardapio_id, qtd)             │
└───────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados

### Criar Pedido (Cliente)

```
1. Cliente preenche formulário
   └─ mesa, cliente_nome, cliente_telefone, itens[]

2. Frontend valida dados
   └─ verifica se tudo está preenchido

3. POST /api/pedidos
   ├─ Backend recebe pedido
   ├─ Valida dados
   ├─ Inicia TRANSAÇÃO no BD
   ├─ INSERT INTO pedidos
   ├─ INSERT INTO itens_pedido (para cada item)
   ├─ Calcula total
   ├─ COMMIT transação
   └─ SELECT retorna pedido completo

4. Socket.io emite para atendentes
   └─ io.to('painel_atendentes').emit('novo_pedido_recebido')

5. Frontend mostra sucesso
   └─ Limpa formulário e carrinho

6. Atendente vê novo pedido em tempo real
   └─ Dashboard atualiza automaticamente
```

### Atualizar Status (Atendente)

```
1. Atendente clica botão de status
   └─ ex: "Preparando"

2. Frontend envia PATCH /api/pedidos/:id/status
   ├─ Inclui Authorization: Bearer {token}
   └─ { status: "preparando" }

3. Backend autentica atendente
   ├─ Valida JWT
   ├─ Confirma que é atendente válido
   └─ Permite operação

4. UPDATE pedidos SET status = $1
   ├─ Salva novo status
   ├─ Atualiza updated_at
   └─ Retorna pedido atualizado

5. Socket.io emite atualizações
   ├─ io.to('painel_atendentes').emit('status_pedido_atualizado')
   └─ io.emit('cliente_status_atualizado')

6. Atendentes veem mudança em tempo real
   └─ Lista de pedidos se atualiza
```

## 📊 Modelo de Dados

### Relacionamentos

```
users (Atendentes)
└─ 1:N Sessões (futuro)

cardapio (Itens do Menu)
└─ 1:N itens_pedido

pedidos (Pedidos dos Clientes)
├─ N:1 Não tem FK (cliente não é cadastrado)
└─ 1:N itens_pedido

itens_pedido (Itens de cada Pedido)
├─ N:1 pedidos
└─ N:1 cardapio
```

### Schema SQL

```sql
-- Atendentes
users {
  id: SERIAL PRIMARY KEY
  username: VARCHAR(100) UNIQUE NOT NULL
  password_hash: VARCHAR(255) NOT NULL
  created_at: TIMESTAMP
}

-- Itens do cardápio
cardapio {
  id: SERIAL PRIMARY KEY
  nome: VARCHAR(100) NOT NULL
  descricao: TEXT
  preco: DECIMAL(10,2) NOT NULL
  categoria: VARCHAR(50) NOT NULL
  ativo: BOOLEAN DEFAULT TRUE
  created_at: TIMESTAMP
}

-- Pedidos dos clientes
pedidos {
  id: SERIAL PRIMARY KEY
  mesa: INT NOT NULL
  cliente_nome: VARCHAR(100) NOT NULL
  cliente_telefone: VARCHAR(20) NOT NULL
  status: VARCHAR(50) DEFAULT 'pendente'
    -- Valores: 'pendente', 'preparando', 'pronto', 'entregue'
  total: DECIMAL(10,2) NOT NULL
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

-- Itens de cada pedido
itens_pedido {
  id: SERIAL PRIMARY KEY
  pedido_id: INT NOT NULL FK → pedidos(id)
  cardapio_id: INT NOT NULL FK → cardapio(id)
  quantidade: INT NOT NULL
  preco_unitario: DECIMAL(10,2) NOT NULL
}
```

## 🔌 Endpoints API

### Autenticação

```
POST /api/auth/login
├─ Request: { username, password }
└─ Response: { token }

POST /api/auth/register
├─ Request: { username, password }
└─ Response: { user }
```

### Cardápio (Público)

```
GET /api/cardapio
├─ Query: (nenhuma)
└─ Response: [{id, nome, preco, categoria, ...}]

GET /api/cardapio/categoria/:categoria
├─ Params: categoria
└─ Response: [{id, nome, preco, ...}]
```

### Pedidos (Cliente)

```
POST /api/pedidos
├─ Request: {
│   mesa: INT,
│   cliente_nome: STRING,
│   cliente_telefone: STRING,
│   itens: [{cardapio_id, quantidade}]
│ }
└─ Response: { pedido }
```

### Pedidos (Atendente - Autenticado)

```
GET /api/pedidos
├─ Headers: Authorization: Bearer {token}
└─ Response: [{id, mesa, status, itens, total, ...}]

GET /api/pedidos/:id
├─ Params: id
└─ Response: { pedido com itens }

PATCH /api/pedidos/:id/status
├─ Headers: Authorization: Bearer {token}
├─ Request: { status: "preparando" | "pronto" | "entregue" }
└─ Response: { pedido }
```

## 🔐 Fluxo de Autenticação

```
1. Atendente faz login
   └─ POST /api/auth/login { username, password }

2. Backend verifica credenciais
   ├─ SELECT user WHERE username = $1
   ├─ bcrypt.compare(password, password_hash)
   └─ Se válido → gera JWT

3. JWT é retornado
   └─ token = jwt.sign({ id, username }, SECRET, { expiresIn: '7d' })

4. Frontend armazena token
   └─ localStorage.setItem('token', token)

5. Próximas requisições incluem token
   ├─ Headers: Authorization: Bearer {token}
   └─ Middleware valida JWT

6. Se token válido
   ├─ Requisição prossegue
   ├─ req.user = decoded JWT
   └─ Autorização é verificada

7. Se token expirado
   ├─ Retorna 403 Forbidden
   ├─ Frontend redireciona para login
   └─ Usuário faz novo login
```

## 📡 WebSocket (Socket.io)

### Eventos do Servidor

```
server → client

1. novo_pedido_recebido
   ├─ Para: sala 'painel_atendentes'
   └─ Dados: { pedido object completo }

2. status_pedido_atualizado
   ├─ Para: sala 'painel_atendentes'
   └─ Dados: { pedido atualizado }

3. cliente_status_atualizado (futuro)
   ├─ Para: todos os clientes
   └─ Dados: { pedido_id, status }
```

### Eventos do Cliente

```
client → server

1. registrar_atendente
   ├─ Quando: Atendente conecta
   ├─ Ação: Socket entra na sala 'painel_atendentes'
   └─ Dados: (nenhum)

2. disconnect
   ├─ Quando: Cliente desconecta
   └─ Ação: Limpa salas e conexões
```

## 🚀 Escalabilidade

### Atual (Simples)
- ✅ 1 servidor Node.js
- ✅ 1 banco PostgreSQL
- ✅ Socket.io em memória
- ✅ Até 1000 conexões simultâneas

### Futuro (Escalável)
- [ ] Load balancer (Nginx, HAProxy)
- [ ] Múltiplos servidores Node.js
- [ ] Redis para session/cache
- [ ] Socket.io com adapter Redis
- [ ] Read replicas do PostgreSQL
- [ ] CDN para assets estáticos

## 🔧 Dependências do Projeto

```
Backend (Node.js):
├─ express (framework HTTP)
├─ socket.io (WebSocket)
├─ pg (PostgreSQL driver)
├─ bcryptjs (hash de senhas)
├─ jsonwebtoken (JWT)
├─ dotenv (variáveis de ambiente)
└─ cors (Cross-Origin Resource Sharing)

Frontend:
├─ HTML5
├─ CSS3
├─ JavaScript Vanilla
└─ Socket.io client (CDN)
```

## 📁 Estrutura de Pastas

```
café/
├─ README.md                 # Documentação principal
├─ TESTE_RAPIDO.md           # Guia de testes
├─ ARQUITETURA.md            # Este arquivo
├─ SETUP_DATABASE.sql        # Script de setup
├─ setup.sh                  # Setup para Linux/Mac
├─ setup.bat                 # Setup para Windows
├─ server.js                 # Backend principal (consolidado)
├─ frontend-cliente.html     # Interface do cliente
├─ frontend-atendente.html   # Interface do atendente
│
└─ cafe-app-backend/         # Pasta do backend
   ├─ package.json
   ├─ package-lock.json
   ├─ .env                   # Variáveis de ambiente
   ├─ node_modules/          # Dependências npm
   ├─ config/
   │  ├─ database.js         # Conexão PostgreSQL
   │  └─ database.sql        # Schema do banco
   ├─ middleware/
   │  └─ auth.js             # Autenticação JWT
   ├─ routes/
   │  ├─ auth.js             # Login/Register
   │  ├─ cardapio.js         # Cardápio
   │  └─ pedidos.js          # Pedidos
   └─ models/
      └─ (futuro)
```

## 🎯 Próximas Melhorias

1. **Performance**
   - Cache de cardápio com Redis
   - Paginação de pedidos
   - Índices adicionais no BD

2. **Funcionalidades**
   - Histórico de pedidos por cliente
   - Relatórios de vendas
   - Sistema de cupons/descontos
   - Foto dos itens

3. **Segurança**
   - Rate limiting
   - HTTPS/SSL
   - 2FA para atendentes
   - Audit logs

4. **UX/UI**
   - Progressive Web App (PWA)
   - App mobile nativa
   - Dark mode
   - Notificações push

5. **DevOps**
   - Docker containers
   - CI/CD pipeline
   - Monitoramento
   - Logs centralizados

---

**Diagrama atualizado**: 2024
**Versão**: 1.0.0
