# 🚀 Guia Rápido de Teste

## ✅ Checklist de Instalação

- [ ] Node.js instalado (verificar: `node -v`)
- [ ] PostgreSQL instalado e rodando
- [ ] npm install executado em `cafe-app-backend`
- [ ] `.env` configurado com dados do PostgreSQL
- [ ] Banco de dados criado: `CREATE DATABASE cafe_app;`
- [ ] Script SQL executado: `psql -U postgres -d cafe_app -f SETUP_DATABASE.sql`

## 🎬 Teste Rápido (5 minutos)

### 1️⃣ Iniciar Backend
```bash
cd cafe-app-backend
npm start
```

**Esperado**: 
```
☕ Servidor rodando na porta 3000
📍 Cardápio: http://localhost:3000/api/cardapio
🔑 Login: POST http://localhost:3000/api/auth/login
```

### 2️⃣ Testar API com CURL (em outro terminal)

**Verificar cardápio:**
```bash
curl http://localhost:3000/api/cardapio
```

**Fazer login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Esperado**: Retorna um token JWT

**Criar pedido:**
```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "mesa": 5,
    "cliente_nome": "João",
    "cliente_telefone": "11999999999",
    "itens": [
      {"cardapio_id": 1, "quantidade": 2},
      {"cardapio_id": 4, "quantidade": 1}
    ]
  }'
```

### 3️⃣ Acessar Painel do Cliente

**Via arquivo local** (Windows):
```
file:///C:/Users/lucas/Desktop/Projetos/café/frontend-cliente.html
```

**Ou via HTTP** (melhor compatibilidade):
```bash
# Na pasta raiz do projeto, inicie um servidor HTTP
python -m http.server 8000
# Acesse: http://localhost:8000/frontend-cliente.html
```

**Teste:**
- [ ] Preencher mesa (1-10)
- [ ] Preencher nome e telefone
- [ ] Adicionar 2-3 itens
- [ ] Ver total correto
- [ ] Clicar "Enviar Pedido"
- [ ] Receber mensagem de sucesso

### 4️⃣ Acessar Painel do Atendente

**Via arquivo local**:
```
file:///C:/Users/lucas/Desktop/Projetos/café/frontend-atendente.html
```

**Login com:**
- Username: `admin`
- Password: `admin123`

**Teste:**
- [ ] Login bem-sucedido
- [ ] Ver pedido criado na etapa 3
- [ ] Ver notificação de novo pedido
- [ ] Clicar em "Preparando"
- [ ] Clicar em "Pronto"
- [ ] Clicar em "Entregue"
- [ ] Status muda em tempo real

## 🔧 Troubleshooting Rápido

### ❌ "Cannot POST /api/pedidos"
- Verificar se backend está rodando na porta 3000
- Verificar console do backend para erros

### ❌ "Erro de conexão com banco de dados"
- PostgreSQL não está rodando
- Credenciais em `.env` estão incorretas
- Banco `cafe_app` não existe

### ❌ "CORS error" no navegador
- Usar HTTP (servidor local) em vez de file://
- Backend tem CORS habilitado (`cors: "*"`)

### ❌ "Token não fornecido" ao fazer login
- API está retornando erro
- Verificar console do backend

### ❌ Painel do atendente não vê novos pedidos
- Socket.io pode não estar conectando
- Abrir DevTools (F12) → Console
- Procurar por erros de conexão
- Backend deve estar rodando

## 📊 Teste Completo

1. **Abrir 2 navegadores:**
   - Um para cliente
   - Um para atendente (faça login)

2. **Cliente cria pedido**
   - Preenche formulário
   - Clica "Enviar Pedido"

3. **Atendente recebe em tempo real**
   - Novo pedido aparece imediatamente
   - Som/notificação pode ser adicionado

4. **Atendente atualiza status**
   - Clica em "Preparando"
   - Pode adicionar WebSocket no cliente para atualizar também

5. **Ciclo completo**
   - Pendente → Preparando → Pronto → Entregue

## 🎯 Cenários de Teste

### Cenário 1: Mesa 1 - Cliente 1
```
Dados: Mesa 1, João Silva, 11999999999
Itens: 2x Café Expresso, 1x Croissant
Total: R$ 15,50
```

### Cenário 2: Mesa 5 - Cliente 2
```
Dados: Mesa 5, Maria, 11988888888
Itens: 3x Cappuccino, 2x Bolo de Chocolate
Total: R$ 34,00
```

### Cenário 3: Mesa 10 - Cliente 3
```
Dados: Mesa 10, Pedro, 11977777777
Itens: 1x Sanduíche de Frango, 1x Suco Natural
Total: R$ 19,00
```

## 📈 Métricas para Validar

- [ ] Cardápio carrega em < 1s
- [ ] Pedido é criado em < 500ms
- [ ] Atendente recebe notificação em tempo real (< 1s)
- [ ] Status muda sem refresh na página
- [ ] Múltiplos pedidos simultâneos funcionam
- [ ] Login/logout funciona
- [ ] Filtros de status funcionam

## 🐛 Como Gerar Logs

**Backend:**
```bash
# Já mostra logs por padrão no console
```

**Frontend (DevTools):**
1. Abrir F12
2. Ir em Console
3. Ver mensagens de log
4. Procurar por erros em vermelho

**PostgreSQL:**
```bash
# Verificar tabelas criadas
psql -U postgres -d cafe_app
\dt
SELECT * FROM cardapio;
SELECT * FROM pedidos;
```

## 🎉 Sucesso!

Se todos os testes passarem, o app está funcionando! 

Próximos passos opcionais:
- [ ] Adicionar fotos dos itens
- [ ] Integrar sistema de pagamento
- [ ] Deploy em servidor
- [ ] Adicionar notificações (SMS/WhatsApp)
- [ ] Criar relatórios de vendas
