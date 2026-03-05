import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use(express.static('../dist'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Fallback para API
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
});

// Fallback para frontend
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: '../dist' });
});

// WebSocket básico
io.on('connection', (socket) => {
    console.log(`🔌 New WebSocket connection: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`🔌 Socket ${socket.id} disconnected`);
    });
});

server.listen(port, () => {
    console.log(`🚀 API Server started on http://0.0.0.0:${port}`);
    console.log(`📱 Frontend acessível via celular: https://livego.store:3000`);
    console.log(`🔗 API endpoints: https://livego.store:${port}/api/*`);
    console.log(`🔌 WebSocket server rodando na mesma porta ${port}`);
});

export const getIO = () => io;
