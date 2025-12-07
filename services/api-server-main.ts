import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import apiRouter from './api-server';
import { webSocketServerInstance } from './websocket';
import { db, initializeDatabase } from './database';

// Configuração do servidor
const app = express();
const server = http.createServer(app);

// Configuração do CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Middleware para parsear JSON
app.use(express.json());

// Rotas da API
app.use('/api', apiRouter);

// Rota padrão para verificar se a API está rodando
app.get('/', (req, res) => {
    res.status(200).json({
        status: 200,
        data: {
            name: 'LiveGo API',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        }
    });
});

// Rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        error: 'Rota não encontrada'
    });
});

// Configuração do WebSocket
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Integração do WebSocket com o servidor
io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);
    
    // Aqui você pode adicionar lógica de autenticação do socket
    socket.on('authenticate', (token) => {
        // Implemente a autenticação do usuário
        console.log('Autenticando socket:', socket.id);
    });
    
    // Lida com a desconexão do cliente
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        // Inicializa o banco de dados
        await initializeDatabase();
        
        // Inicia o servidor
        server.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📡 WebSocket está ativo`);
            console.log(`💾 Banco de dados inicializado com ${db.users.size} usuários`);
        });
        
    } catch (error) {
        console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
};

// Inicia o servidor
startServer();

// Manipuladores de encerramento gracioso
process.on('SIGTERM', () => {
    console.log('Encerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado');
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'motivo:', reason);
});

export default server;
