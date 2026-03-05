import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const checkNetworkConfig = () => {
    console.log('🔍 Verificando configurações de rede...');
    
    // Verificar IP local
    exec('ipconfig', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Erro ao verificar IP:', error);
            return;
        }
        
        console.log('\n📡 Configurações de rede:');
        
        // Encontrar IPv4
        const lines = stdout.split('\n');
        let ipv4Address = null;
        
        for (const line of lines) {
            if (line.includes('IPv4') || line.includes('Endereço IPv4')) {
                const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
                if (match) {
                    ipv4Address = match[1];
                    console.log(`  ✅ IPv4 encontrado: ${ipv4Address}`);
                    break;
                }
            }
        }
        
        if (!ipv4Address) {
            console.log('  ❌ IPv4 não encontrado');
            return;
        }
        
        // Verificar se o IP informado pelo usuário está na rede
        const userIP = '192.68.3.12';
        const userIPParts = userIP.split('.').map(Number);
        const localIPParts = ipv4Address.split('.').map(Number);
        
        // Verificar se estão na mesma sub-rede (primeiros 3 octetos)
        const sameSubnet = userIPParts[0] === localIPParts[0] && 
                           userIPParts[1] === localIPParts[1] && 
                           userIPParts[2] === localIPParts[2];
        
        console.log(`\n🔍 Análise de rede:`);
        console.log(`  📱 IP do celular: ${userIP}`);
        console.log(`  💻 IP local: ${ipv4Address}`);
        console.log(`  🌐 Mesma sub-rede: ${sameSubnet ? '✅ SIM' : '❌ NÃO'}`);
        
        if (!sameSubnet) {
            console.log(`\n⚠️  PROVÁVEL PROBLEMA: Celular e computador não estão na mesma rede!`);
            console.log(`   Solução: Conecte o celular à mesma rede Wi-Fi do computador.`);
        } else {
            console.log(`\n✅ Rede OK! Celular e computador estão na mesma rede.`);
        }
        
        // Verificar porta
        console.log(`\n🔌 Configurações do servidor:`);
        console.log(`  📡 Host: 0.0.0.0 (aceita conexões externas)`);
        console.log(`  🚪 Porta: 3000 (backend)`);
        console.log(`  🚪 Porta: 5173 (frontend)`);
        
        console.log(`\n📱 URLs para acessar pelo celular:`);
        console.log(`  🌐 Frontend: http://${ipv4Address}:5173`);
        console.log(`  🔗 Backend API: http://${ipv4Address}:3000`);
        console.log(`  💬 WebSocket: ws://${ipv4Address}:3000`);
        
        console.log(`\n🔧 Configurações necessárias no frontend:`);
        console.log(`  - API URL: http://${ipv4Address}:3000`);
        console.log(`  - WebSocket URL: http://${ipv4Address}:3000`);
        
        console.log(`\n🛡️ Verificação de firewall:`);
        console.log(`  ⚠️  Verifique se o firewall permite conexões nas portas 3000 e 5173`);
        console.log(`  ⚠️  No Windows: Configurações > Segurança do Windows > Firewall`);
        console.log(`  ⚠️  Adicione regras para permitir Node.js nas portas 3000 e 5173`);
        
        console.log(`\n📋 Passos para testar:`);
        console.log(`  1. Conecte o celular à mesma rede Wi-Fi`);
        console.log(`  2. Inicie o backend: npm run dev`);
        console.log(`  3. Inicie o frontend: npm run dev (na pasta frontend)`);
        console.log(`  4. Acesse pelo celular: http://${ipv4Address}:5173`);
        console.log(`  5. Teste login/cadastro`);
        
        console.log(`\n🎉 Configuração concluída!`);
    });
};

// Executar verificação
checkNetworkConfig();
