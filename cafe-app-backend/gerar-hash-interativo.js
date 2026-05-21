const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function gerarHash() {
    rl.question('Digite a senha desejada (padrão: admin123): ', async (senha) => {
        const senhaFinal = senha.trim() || 'admin123';
        
        try {
            console.log('\n🔒 Gerando hash bcrypt...\n');
            const hash = await bcrypt.hash(senhaFinal, 10);
            
            console.log('✅ Hash gerado com sucesso!\n');
            console.log('Hash para a senha "' + senhaFinal + '":');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(hash);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            console.log('📋 Para usar este hash no banco de dados, execute:');
            console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';\n`);
            
            console.log('💡 Ou use o script: node resetar-admin.js\n');
            
            rl.close();
        } catch (error) {
            console.error('❌ Erro ao gerar hash:', error.message);
            rl.close();
            process.exit(1);
        }
    });
}

gerarHash();
