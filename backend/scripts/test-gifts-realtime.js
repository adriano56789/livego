// Script de teste para sistema de presentes em tempo real
// Testa concorrência, sincronização e performance

const WebSocket = require('ws');
const axios = require('axios');

const WS_URL = 'ws://192.168.3.12:3000';
const API_URL = 'http://192.168.3.12:3000';

class GiftStressTest {
    constructor() {
        this.connections = [];
        this.testResults = {
            totalGifts: 0,
            successfulGifts: 0,
            failedGifts: 0,
            concurrentUsers: 0,
            startTime: null,
            endTime: null,
            errors: []
        };
    }

    async connectUser(userId, userName, streamId) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL);
            
            ws.on('open', () => {
                console.log(`👤 Usuário ${userName} conectado`);
                
                // Entrar na sala da live
                ws.send(JSON.stringify({
                    type: 'join_stream',
                    data: { userId, streamId }
                }));
                
                this.connections.push({
                    userId,
                    userName,
                    ws,
                    giftsReceived: 0,
                    connected: true
                });
                
                resolve(ws);
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                
                if (message.type === 'live_gift_received') {
                    const conn = this.connections.find(c => c.userId === userId);
                    if (conn) {
                        conn.giftsReceived++;
                        console.log(`🎁 ${userName} recebeu presente: ${message.data.gift.name}`);
                    }
                }
            });
            
            ws.on('error', (error) => {
                console.error(`❌ Erro na conexão de ${userName}:`, error);
                this.testResults.errors.push(`Connection error for ${userName}: ${error.message}`);
                reject(error);
            });
            
            ws.on('close', () => {
                console.log(`🔴 Usuário ${userName} desconectado`);
                const conn = this.connections.find(c => c.userId === userId);
                if (conn) conn.connected = false;
            });
        });
    }

    async sendGift(fromUserId, toUserId, giftId, quantity = 1, streamId) {
        try {
            const response = await axios.post(`${API_URL}/api/gifts/send`, {
                fromUserId,
                toUserId,
                giftId,
                quantity,
                streamId
            });
            
            this.testResults.successfulGifts++;
            console.log(`✅ Presente enviado: ${fromUserId} -> ${toUserId} (${quantity}x ${giftId})`);
            
            return response.data;
        } catch (error) {
            this.testResults.failedGifts++;
            console.error(`❌ Erro ao enviar presente:`, error.response?.data || error.message);
            this.testResults.errors.push(`Gift send error: ${error.message}`);
            throw error;
        }
    }

    async runConcurrencyTest(numUsers = 20, giftsPerUser = 5) {
        console.log(`🚀 Iniciando teste de concorrência: ${numUsers} usuários, ${giftsPerUser} presentes cada`);
        this.testResults.startTime = new Date();
        this.testResults.concurrentUsers = numUsers;
        
        const streamId = 'test-stream-123';
        const streamerId = 'streamer-123';
        
        // Conectar todos os usuários
        const connectionPromises = [];
        for (let i = 0; i < numUsers; i++) {
            const userId = `user-${i}`;
            const userName = `Usuário${i}`;
            connectionPromises.push(this.connectUser(userId, userName, streamId));
        }
        
        await Promise.all(connectionPromises);
        console.log(`✅ ${numUsers} usuários conectados`);
        
        // Enviar presentes simultaneamente
        const giftPromises = [];
        const gifts = ['rose', 'heart', 'star', 'diamond', 'crown'];
        
        for (let i = 0; i < numUsers; i++) {
            for (let j = 0; j < giftsPerUser; j++) {
                const fromUserId = `user-${i}`;
                const giftId = gifts[j % gifts.length];
                const quantity = Math.floor(Math.random() * 5) + 1;
                
                giftPromises.push(
                    this.sendGift(fromUserId, streamerId, giftId, quantity, streamId)
                        .catch(err => console.log(`Falha no presente ${i}-${j}:`, err.message))
                );
                
                this.testResults.totalGifts++;
            }
        }
        
        console.log(`🎁 Enviando ${this.testResults.totalGifts} presentes simultaneamente...`);
        
        // Aguardar todos os presentes serem enviados
        await Promise.allSettled(giftPromises);
        
        // Aguardar um pouco para receber todos os presentes via WebSocket
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        this.testResults.endTime = new Date();
        this.printResults();
    }

    printResults() {
        const duration = this.testResults.endTime - this.testResults.startTime;
        const giftsPerSecond = (this.testResults.successfulGifts / duration) * 1000;
        
        console.log('\n📊 RESULTADOS DO TESTE:');
        console.log('='.repeat(50));
        console.log(`⏱️  Duração: ${duration}ms`);
        console.log(`👥 Usuários concorrentes: ${this.testResults.concurrentUsers}`);
        console.log(`🎁 Total de presentes: ${this.testResults.totalGifts}`);
        console.log(`✅ Presentes bem-sucedidos: ${this.testResults.successfulGifts}`);
        console.log(`❌ Presentes falharam: ${this.testResults.failedGifts}`);
        console.log(`🚀 Presentes/segundo: ${giftsPerSecond.toFixed(2)}`);
        console.log(`📈 Taxa de sucesso: ${((this.testResults.successfulGifts / this.testResults.totalGifts) * 100).toFixed(2)}%`);
        
        console.log('\n📥 Presentes recebidos por usuário:');
        this.connections.forEach(conn => {
            if (conn.connected) {
                console.log(`   ${conn.userName}: ${conn.giftsReceived} presentes`);
            }
        });
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ Erros encontrados:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        console.log('\n🎯 TESTE CONCLUÍDO!');
    }

    async cleanup() {
        console.log('🧹 Limpando conexões...');
        this.connections.forEach(conn => {
            if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.close();
            }
        });
        this.connections = [];
    }
}

// Executar teste
async function main() {
    const test = new GiftStressTest();
    
    try {
        await test.runConcurrencyTest(20, 5); // 20 usuários, 5 presentes cada
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await test.cleanup();
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}

module.exports = GiftStressTest;
