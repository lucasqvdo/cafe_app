const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: '*', // Permite que a Vercel acesse a API futuramente
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ========== DATABASE ==========
// 🟢 CORREÇÃO 1: Usando a string de conexão do Neon com suporte a SSL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
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

// Middleware para verificar se é admin
const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta', async (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }

        try {
            const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [user.id]);
            
            if (result.rows.length === 0 || !result.rows[0].is_admin) {
                return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem fazer isso.' });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao verificar permissões' });
        }
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
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
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
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'sua_chave_secreta',
            { expiresIn: '7d' }
        );

        res.json({ 
            message: 'Login realizado com sucesso', 
            token,
            usuario: {
                id: user.id,
                username: user.username,
                is_admin: user.is_admin
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Verificar dados do usuário autenticado
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, is_admin FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ usuario: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
});

// ========== ROUTES: GERENCIAR SENHA ==========
app.patch('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { senhaAtual, novaSenha, confirmarSenha } = req.body;

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        if (novaSenha !== confirmarSenha) {
            return res.status(400).json({ error: 'As senhas não conferem' });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
        }

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(senhaAtual, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Senha atual incorreta' });
        }

        const novoHash = await bcrypt.hash(novaSenha, 10);

        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [novoHash, req.user.id]
        );

        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
});

// ========== ROUTES: GERENCIAR USUÁRIOS (ADMIN) ==========

// Listar todos os usuários (apenas admin)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, is_admin, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({ usuarios: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// Criar novo usuário (apenas admin)
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const { username, password, is_admin } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, username, is_admin, created_at',
            [username, hashedPassword, is_admin || false]
        );

        res.status(201).json({ 
            message: 'Usuário criado com sucesso!', 
            usuario: result.rows[0] 
        });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Username já existe' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Editar usuário (apenas admin)
app.patch('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, is_admin } = req.body;

        // Evitar que admin remova seu próprio acesso admin
        if (id == req.user.id && is_admin === false) {
            return res.status(400).json({ error: 'Você não pode remover seu próprio acesso admin' });
        }

        let query = 'UPDATE users SET ';
        let values = [];
        let paramCount = 1;

        if (username !== undefined) {
            query += `username = $${paramCount} `;
            values.push(username);
            paramCount++;
        }

        if (is_admin !== undefined) {
            if (values.length > 0) query += ', ';
            query += `is_admin = $${paramCount} `;
            values.push(is_admin);
            paramCount++;
        }

        if (values.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        query += ` WHERE id = $${paramCount} RETURNING id, username, is_admin, created_at`;
        values.push(id);

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ 
            message: 'Usuário atualizado com sucesso!', 
            usuario: result.rows[0] 
        });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Username já existe' });
        }
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// Resetar senha de um usuário (apenas admin)
app.patch('/api/admin/users/:id/reset-password', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { novaSenha } = req.body;

        if (!novaSenha) {
            return res.status(400).json({ error: 'Nova senha é obrigatória' });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
        }

        const novoHash = await bcrypt.hash(novaSenha, 10);

        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username, is_admin, created_at',
            [novoHash, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ 
            message: 'Senha resetada com sucesso!', 
            usuario: result.rows[0] 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
});

// Deletar usuário (apenas admin)
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Evitar que admin delete a si mesmo
        if (id == req.user.id) {
            return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
        }

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING username',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ 
            message: 'Usuário deletado com sucesso!', 
            username: result.rows[0].username 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
});

// ========== ROUTES: CARDÁPIO ==========
app.get('/api/cardapio', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nome, descricao, preco, categoria FROM cardapio WHERE ativo = TRUE ORDER BY categoria, nome'
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar cardápio' });
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

            // 🟢 CORREÇÃO 2: Evento Socket.io atualizado para coincidir com o Frontend (novoPedido)
            io.emit('novoPedido', pedidoCompleto);

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
            WHERE p.status <> 'entregue'
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
});

app.get('/api/pedidos/historico', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        let query = `
            SELECT 
                p.id, p.mesa, p.cliente_nome, p.cliente_telefone, p.status, p.total, p.created_at, p.updated_at,
                json_agg(
                    json_build_object('id', ip.id, 'cardapio_id', ip.cardapio_id, 'quantidade', ip.quantidade, 'preco_unitario', ip.preco_unitario, 'nome', c.nome)
                ) as itens
            FROM pedidos p
            LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
            LEFT JOIN cardapio c ON ip.cardapio_id = c.id
        `;

        const values = [];
        if (q) {
            query += `WHERE p.cliente_nome ILIKE $1 OR p.cliente_telefone ILIKE $1 OR p.id::text = $2 `;
            values.push(`%${q}%`, q);
        }

        query += `GROUP BY p.id ORDER BY p.created_at DESC LIMIT 100`;

        const result = await pool.query(query, values);
        res.json({ pedidos: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar histórico de pedidos' });
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

        // 🟢 CORREÇÃO 3: Evento Socket.io atualizado para coincidir com o Frontend (pedidoAtualizado)
        io.emit('pedidoAtualizado', pedidoAtualizado);
        io.emit('cliente_status_atualizado', { pedido_id: id, status });

        res.json({ message: 'Status atualizado', pedido: pedidoAtualizado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// ========== ROUTES: CLIENTES ==========
app.get('/api/clientes', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT 
                cliente_nome,
                cliente_telefone,
                COUNT(*) as total_pedidos,
                MAX(created_at) as ultimo_pedido
            FROM pedidos
            GROUP BY cliente_nome, cliente_telefone
            ORDER BY ultimo_pedido DESC
        `);

        res.json({ clientes: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

app.get('/api/clientes/:telefone/pedidos', authenticateToken, async (req, res) => {
    try {
        const { telefone } = req.params;

        const result = await pool.query(`
            SELECT 
                p.id, p.mesa, p.cliente_nome, p.cliente_telefone, p.status, p.total, p.created_at, p.updated_at,
                json_agg(
                    json_build_object('id', ip.id, 'cardapio_id', ip.cardapio_id, 'quantidade', ip.quantidade, 'preco_unitario', ip.preco_unitario, 'nome', c.nome)
                ) as itens
            FROM pedidos p
            LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
            LEFT JOIN cardapio c ON ip.cardapio_id = c.id
            WHERE p.cliente_telefone = $1
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT 20
        `, [telefone]);

        res.json({ pedidos: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pedidos do cliente' });
    }
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n☕ Servidor rodando na porta ${PORT}`);
    console.log(`📍 Cardápio: http://localhost:${PORT}/api/cardapio`);
    console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login\n`);
});