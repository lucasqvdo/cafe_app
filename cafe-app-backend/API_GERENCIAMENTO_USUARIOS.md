# 📋 Documentação das Novas Funcionalidades de Gerenciamento de Usuários

## 🔐 Autenticação

### 1. Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

# Resposta:
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Use o token retornado em todas as requisições autenticadas no header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔑 Trocar Senha (Qualquer Usuário Autenticado)

### Alterar sua própria senha
```bash
PATCH /api/auth/change-password
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "senhaAtual": "admin123",
  "novaSenha": "novasenha123",
  "confirmarSenha": "novasenha123"
}

# Resposta:
{
  "message": "Senha alterada com sucesso!"
}
```

---

## 👥 Gerenciar Usuários (APENAS ADMIN)

### 1. Listar todos os usuários
```bash
GET /api/admin/users
Authorization: Bearer <TOKEN_ADMIN>

# Resposta:
{
  "usuarios": [
    {
      "id": 1,
      "username": "admin",
      "is_admin": true,
      "created_at": "2026-05-20T15:34:08.648338Z"
    },
    {
      "id": 2,
      "username": "joao",
      "is_admin": false,
      "created_at": "2026-05-21T10:20:00.000000Z"
    }
  ]
}
```

### 2. Criar novo usuário (atendente)
```bash
POST /api/admin/users
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json

{
  "username": "joao",
  "password": "senha123",
  "is_admin": false
}

# Resposta:
{
  "message": "Usuário criado com sucesso!",
  "usuario": {
    "id": 2,
    "username": "joao",
    "is_admin": false,
    "created_at": "2026-05-21T10:20:00.000000Z"
  }
}
```

### 3. Editar usuário
```bash
PATCH /api/admin/users/2
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json

{
  "username": "joao_silva",
  "is_admin": false
}

# Resposta:
{
  "message": "Usuário atualizado com sucesso!",
  "usuario": {
    "id": 2,
    "username": "joao_silva",
    "is_admin": false,
    "created_at": "2026-05-21T10:20:00.000000Z"
  }
}
```

### 4. Resetar senha de um usuário
```bash
PATCH /api/admin/users/2/reset-password
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json

{
  "novaSenha": "senhaTemporaria123"
}

# Resposta:
{
  "message": "Senha resetada com sucesso!",
  "usuario": {
    "id": 2,
    "username": "joao",
    "is_admin": false,
    "created_at": "2026-05-21T10:20:00.000000Z"
  }
}
```

### 5. Deletar usuário
```bash
DELETE /api/admin/users/2
Authorization: Bearer <TOKEN_ADMIN>

# Resposta:
{
  "message": "Usuário deletado com sucesso!",
  "username": "joao"
}
```

---

## 🔒 Regras de Segurança

✅ **Implementadas:**
- Apenas admin pode criar, editar e deletar usuários
- Admin não pode remover seu próprio acesso admin
- Admin não pode deletar sua própria conta
- Senhas devem ter no mínimo 6 caracteres
- Todas as senhas são hasheadas com bcryptjs (10 rounds)
- Tokens JWT expiram em 7 dias

---

## 📝 Exemplo Completo de Workflow

### 1. Admin faz login
```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
# Obtém token: abc123...
```

### 2. Admin cria um novo atendente
```bash
POST /api/admin/users
Authorization: Bearer abc123...
{
  "username": "maria",
  "password": "senha456",
  "is_admin": false
}
# Novo usuário criado com ID 2
```

### 3. Admin lista todos os usuários
```bash
GET /api/admin/users
Authorization: Bearer abc123...
# Retorna lista com admin e maria
```

### 4. Maria (atendente) faz login
```bash
POST /api/auth/login
{
  "username": "maria",
  "password": "senha456"
}
# Maria obtém seu token: xyz789...
```

### 5. Maria muda sua própria senha
```bash
PATCH /api/auth/change-password
Authorization: Bearer xyz789...
{
  "senhaAtual": "senha456",
  "novaSenha": "novaSenha789",
  "confirmarSenha": "novaSenha789"
}
# Senha alterada com sucesso
```

### 6. Admin reseta a senha de Maria
```bash
PATCH /api/admin/users/2/reset-password
Authorization: Bearer abc123...
{
  "novaSenha": "senhaTemporaria"
}
# Senha de Maria foi resetada
```

---

## ⚠️ Possíveis Erros

| Código | Mensagem | Causa |
|--------|----------|-------|
| 400 | "Username e password são obrigatórios" | Faltam campos |
| 400 | "A senha deve ter pelo menos 6 caracteres" | Senha muito curta |
| 401 | "Usuário ou senha inválidos" | Credenciais incorretas |
| 403 | "Acesso negado. Apenas administradores podem fazer isso." | Usuário não é admin |
| 404 | "Usuário não encontrado" | ID não existe |
| 409 | "Username já existe" | Username duplicado |
| 500 | "Erro ao..." | Erro no servidor |

---

## 🚀 Próximos Passos

- Implementar interface web para gerenciar usuários
- Adicionar logs de auditoria de quem criou/editou usuários
- Implementar recuperação de senha por email
- Adicionar 2FA (autenticação de dois fatores)
