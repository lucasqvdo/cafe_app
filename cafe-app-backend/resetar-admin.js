const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cafe_app',
});

async function resetarAdmin() {
    try {
        // Senha padrão
        const senha = 'admin123';
        
        console.log('🔒 Gerando hash bcrypt para a senha...');
        const hash = await bcrypt.hash(senha, 10);
        
        console.log('\n📝 Hash gerado com sucesso:');
        console.log(hash);
        
        console.log('\n💾 Atualizando banco de dados...');
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING username, id',
            [hash, 'admin']
        );
        
        if (result.rows.length === 0) {
            console.log('\n⚠️  Usuário "admin" não encontrado. Criando novo usuário...');
            const result2 = await pool.query(
                'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
                ['admin', hash]
            );
            console.log('✅ Usuário criado com sucesso!');
            console.log(`   ID: ${result2.rows[0].id}`);
            console.log(`   Username: ${result2.rows[0].username}`);
        } else {
            console.log('✅ Senha do admin atualizada com sucesso!');
            console.log(`   Username: ${result.rows[0].username}`);
            console.log(`   ID: ${result.rows[0].id}`);
        }
        
        console.log('\n🧪 Testando se a senha bate...');
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        const user = userResult.rows[0];
        
        const teste = await bcrypt.compare(senha, user.password_hash);
        if (teste) {
            console.log('✅ SUCESSO! A senha "admin123" agora funciona!');
        } else {
            console.log('❌ ERRO! A senha não está batendo. Algo deu errado.');
        }
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        await pool.end();
        process.exit(1);
    }
}

resetarAdmin();
