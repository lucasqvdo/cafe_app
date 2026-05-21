-- Adicionar coluna is_admin à tabela users (se não existir)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Garantir que o admin é admin
UPDATE users SET is_admin = TRUE WHERE username = 'admin';

-- Ver tabela de usuários
SELECT id, username, is_admin, created_at FROM users;
