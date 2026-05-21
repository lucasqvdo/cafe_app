-- Criar banco de dados
CREATE DATABASE cafe_app;

-- Conectar ao banco de dados (comando local no psql)
-- \c cafe_app;

-- Tabela de usuários (atendentes)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cardápio
CREATE TABLE IF NOT EXISTS cardapio (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    imagem_url VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    mesa INT NOT NULL,
    cliente_nome VARCHAR(100) NOT NULL,
    cliente_telefone VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente',
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL,
    cardapio_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (cardapio_id) REFERENCES cardapio(id)
);

-- Criar usuário de teste
INSERT INTO users (username, password_hash, is_admin) VALUES 
('admin', '$2a$10$eImiTXuWVxfaHNYY0iNAiOpZ2DKKfyVvz1dMi5LFzf5vJCmz9eaGG', TRUE)
ON CONFLICT (username) DO UPDATE SET is_admin = TRUE;

-- Inserir cardápio de exemplo
INSERT INTO cardapio (nome, descricao, preco, categoria, ativo) VALUES
('Café Expresso', 'Café expresso tradicional 30ml', 3.50, 'Bebidas', TRUE),
('Café com Leite', 'Café com leite coado', 5.00, 'Bebidas', TRUE),
('Cappuccino', 'Expresso com leite vaporizado e chocolate', 7.00, 'Bebidas', TRUE),
('Macchiato', 'Expresso com um toque de leite quente', 6.50, 'Bebidas', TRUE),
('Café Americano', 'Expresso diluído em água quente', 4.00, 'Bebidas', TRUE),
('Croissant', 'Croissant folhado de manteiga', 8.00, 'Pães', TRUE),
('Pão de Queijo', 'Pão de queijo quentinho', 6.00, 'Pães', TRUE),
('Bolo de Chocolate', 'Fatia de bolo de chocolate', 6.50, 'Doces', TRUE),
('Bolo de Cenoura com Chocolate', 'Fatia de bolo de cenoura com cobertura', 7.00, 'Doces', TRUE),
('Muffin Blueberry', 'Muffin com blueberry', 7.50, 'Doces', TRUE),
('Brownie', 'Brownie de chocolate', 8.00, 'Doces', TRUE),
('Sanduíche de Presunto e Queijo', 'Sanduíche quente prensado', 12.00, 'Salgados', TRUE),
('Sanduíche de Frango', 'Sanduíche quente com frango desfiado', 13.00, 'Salgados', TRUE),
('Quiche Lorraine', 'Quiche com bacon e queijo', 10.00, 'Salgados', TRUE),
('Quiche de Espinafre', 'Quiche com espinafre e ricota', 9.50, 'Salgados', TRUE),
('Água', 'Água mineral 500ml', 2.50, 'Bebidas', TRUE),
('Refrigerante', 'Refrigerante lata 350ml', 4.00, 'Bebidas', TRUE),
('Suco Natural de Laranja', 'Suco de laranja recém-espremido', 6.00, 'Bebidas', TRUE),
('Suco Natural de Morango', 'Suco de morango recém-espremido', 7.00, 'Bebidas', TRUE),
('Chá Gelado', 'Chá gelado de limão', 5.00, 'Bebidas', TRUE)
ON CONFLICT DO NOTHING;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos(mesa);
CREATE INDEX IF NOT EXISTS idx_cardapio_categoria ON cardapio(categoria);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Comentários sobre o banco
COMMENT ON TABLE users IS 'Tabela de atendentes do café';
COMMENT ON TABLE cardapio IS 'Cardápio do café';
COMMENT ON TABLE pedidos IS 'Pedidos dos clientes';
COMMENT ON TABLE itens_pedido IS 'Itens de cada pedido';
