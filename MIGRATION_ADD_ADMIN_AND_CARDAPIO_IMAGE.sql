-- Adiciona suporte a administradores e imagens de cardápio
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
UPDATE users SET is_admin = TRUE WHERE username = 'admin';

ALTER TABLE cardapio ADD COLUMN IF NOT EXISTS imagem_url VARCHAR(255);
