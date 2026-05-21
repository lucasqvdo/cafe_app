const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ========== DATABASE ==========
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cafe_app',
});

// ========== SERVER SETUP ==========
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ========== MIDDLEWARE ==========
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (!req.user.is_admin) {
            return res.status(403).json({ error: 'Acesso administrativo necessário' });
        }
        next();
    });
};

// ========== SOCKET.IO ==========
io.on('connection', (socket) => {
    console.log(`Dispositivo conectado: ${socket.id}`);

    socket.on('registrar_atendente', () => {
        socket.join('painel_atendentes');
        console.log(`Atendente registrado: ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log(`Dispositivo desconectado: ${socket.id}`);
    });
});

// ========== ROUTES: AUTENTICAÇÃO ==========
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, is_admin = false } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, username, is_admin',
            [username, hashedPassword, is_admin]
        );

        res.status(201).json({ message: 'Atendente criado com sucesso', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Username já existe' });
        }
        res.status(500).json({ error: 'Erro ao criar atendente' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, is_admin FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao carregar usuário' });
    }
});

app.post('/api/users', authenticateAdmin, async (req, res) => {
    try {
        const { username, password, is_admin = false } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, username, is_admin',
            [username, hashedPassword, is_admin]
        );

        res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Username já existe' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

app.get('/api/users', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, is_admin, created_at FROM users ORDER BY username');
        res.json({ users: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

app.patch('/api/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { password, is_admin } = req.body;
        const fields = [];
        const values = [];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push('password_hash = $' + (fields.length + 1));
            values.push(hashedPassword);
        }

        if (typeof is_admin === 'boolean') {
            fields.push('is_admin = $' + (fields.length + 1));
            values.push(is_admin);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id, username, is_admin`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

app.delete('/api/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios' });
        }

        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin },
            process.env.JWT_SECRET || 'sua_chave_secreta',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                username: user.username,
                is_admin: user.is_admin,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// ========== ROUTES: CARDÁPIO ==========
app.get('/api/cardapio', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nome, descricao, preco, categoria, imagem_url FROM cardapio WHERE ativo = TRUE ORDER BY categoria, nome'
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar cardápio' });
    }
});

app.post('/api/cardapio', authenticateAdmin, async (req, res) => {
    try {
        const { nome, descricao, preco, categoria, imagem_url } = req.body;

        if (!nome || !preco || !categoria) {
            return res.status(400).json({ error: 'Nome, preço e categoria são obrigatórios' });
        }

        const result = await pool.query(
            'INSERT INTO cardapio (nome, descricao, preco, categoria, imagem_url, ativo) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id, nome, descricao, preco, categoria, imagem_url',
            [nome, descricao || '', preco, categoria, imagem_url || '']
        );

        res.status(201).json({ message: 'Item do cardápio criado com sucesso', item: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar item do cardápio' });
    }
});

app.patch('/api/cardapio/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, categoria, imagem_url, ativo } = req.body;

        const result = await pool.query(
            'UPDATE cardapio SET nome = $1, descricao = $2, preco = $3, categoria = $4, imagem_url = $5, ativo = COALESCE($6, ativo) WHERE id = $7 RETURNING id, nome, descricao, preco, categoria, imagem_url, ativo',
            [nome, descricao || '', preco, categoria, imagem_url || '', ativo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }

        res.json({ message: 'Item do cardápio atualizado com sucesso', item: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar item do cardápio' });
    }
});

app.delete('/api/cardapio/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE cardapio SET ativo = FALSE WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        res.json({ message: 'Item removido do cardápio' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover item do cardápio' });
    }
});

// ========== ROUTES: PEDIDOS ==========
app.post('/api/pedidos', async (req, res) => {
    try {
        const { mesa, cliente_nome, cliente_telefone, itens } = req.body;

        if (!mesa || !cliente_nome || !cliente_telefone || !itens || itens.length === 0) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const pedidoResult = await client.query(
                'INSERT INTO pedidos (mesa, cliente_nome, cliente_telefone, status, total) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [mesa, cliente_nome, cliente_telefone, 'pendente', 0]
            );

            const pedido = pedidoResult.rows[0];
            let total = 0;

            for (const item of itens) {
                const cardapioResult = await client.query(
                    'SELECT preco FROM cardapio WHERE id = $1',
                    [item.cardapio_id]
                );

                if (cardapioResult.rows.length === 0) {
                    throw new Error(`Item ${item.cardapio_id} não encontrado`);
                }

                const preco_unitario = cardapioResult.rows[0].preco;
                const item_total = preco_unitario * item.quantidade;
                total += item_total;

                await client.query(
                    'INSERT INTO itens_pedido (pedido_id, cardapio_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
                    [pedido.id, item.cardapio_id, item.quantidade, preco_unitario]
                );
            }

            await client.query(
                'UPDATE pedidos SET total = $1 WHERE id = $2',
                [total, pedido.id]
            );

            await client.query('COMMIT');

            const pedidoCompletoResult = await client.query(`
                SELECT 
                    p.id, p.mesa, p.cliente_nome, p.cliente_telefone, p.status, p.total, p.created_at,
                    json_agg(
                        json_build_object('id', ip.id, 'cardapio_id', ip.cardapio_id, 'quantidade', ip.quantidade, 'preco_unitario', ip.preco_unitario, 'nome', c.nome)
                    ) as itens
                FROM pedidos p
                LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
                LEFT JOIN cardapio c ON ip.cardapio_id = c.id
                WHERE p.id = $1
                GROUP BY p.id
            `, [pedido.id]);

            const pedidoCompleto = pedidoCompletoResult.rows[0];

            io.to('painel_atendentes').emit('novo_pedido_recebido', pedidoCompleto);

            res.status(201).json({ message: 'Pedido criado com sucesso', pedido: pedidoCompleto });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar pedido' });
    }
});

app.get('/api/pedidos', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.id, p.mesa, p.cliente_nome, p.cliente_telefone, p.status, p.total, p.created_at, p.updated_at,
                json_agg(
                    json_build_object('id', ip.id, 'cardapio_id', ip.cardapio_id, 'quantidade', ip.quantidade, 'preco_unitario', ip.preco_unitario, 'nome', c.nome)
                ) as itens
            FROM pedidos p
            LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
            LEFT JOIN cardapio c ON ip.cardapio_id = c.id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
});

app.get('/api/pedidos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                p.id, p.mesa, p.cliente_nome, p.cliente_telefone, p.status, p.total, p.created_at, p.updated_at,
                json_agg(
                    json_build_object('id', ip.id, 'cardapio_id', ip.cardapio_id, 'quantidade', ip.quantidade, 'preco_unitario', ip.preco_unitario, 'nome', c.nome)
                ) as itens
            FROM pedidos p
            LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
            LEFT JOIN cardapio c ON ip.cardapio_id = c.id
            WHERE p.id = $1
            GROUP BY p.id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
});

app.patch('/api/pedidos/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const statusValidos = ['pendente', 'preparando', 'pronto', 'entregue'];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        const result = await pool.query(
            'UPDATE pedidos SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        const pedidoAtualizado = result.rows[0];

        io.to('painel_atendentes').emit('status_pedido_atualizado', pedidoAtualizado);
        io.emit('cliente_status_atualizado', { pedido_id: id, status });

        res.json({ message: 'Status atualizado', pedido: pedidoAtualizado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n☕ Servidor rodando na porta ${PORT}`);
    console.log(`📍 Cardápio: http://localhost:${PORT}/api/cardapio`);
    console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login\n`);
});
