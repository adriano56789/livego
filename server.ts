import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// FIX: Define __dirname for ES modules, as it is not available globally.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Em CommonJS (definido no tsconfig.server.json), __dirname é uma variável global.
// O código anterior que usava 'import.meta.url' causava conflitos de módulo.
// O arquivo compilado estará em /dist-server, então subimos um nível para encontrar o .env.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.PORT || !process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.error("ERRO CRÍTICO: Arquivo .env não carregado ou incompleto.");
    (process as any).exit(1);
}

import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './database.js';
import apiRoutes from './routes/api.js';
import srsRoutes from './routes/srsRoutes.js';
import livekitRoutes from './routes/livekitRoutes.js';
import config from './config/settings.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { setupWebSocket } from './controllers/websocketController.js';

connectDB().catch(err => {
    console.error("ERRO CRÍTICO NA CONEXÃO COM O BANCO:", err);
    (process as any).exit(1);
});

const app = express();
const isProduction = config.node_env === 'production';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Global request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const method = req.method;
        const url = req.originalUrl;
        const ip = req.ip || req.socket.remoteAddress || '-';
        
        // Log format: [timestamp] METHOD URL STATUS - DURATIONms - IP
        console.log(`[${new Date().toISOString()}] ${method} ${url} ${status} - ${duration}ms - ${ip}`);
    });
    next();
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, transports: ['websocket'] });

setupWebSocket(io);
app.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).io = io;
    next();
});

app.use('/api', apiRoutes);
app.use('/api', srsRoutes);
app.use('/api', livekitRoutes);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

app.get('/', (req: Request, res: Response) => {
    res.send(`<h1>Servidor LiveGo Online (HTTP)</h1><p>API em: <a href="/api/status">/api/status</a></p>`);
});

app.use(globalErrorHandler);

const listenPort = config.port;

server.on('error', (error: any) => {
    if (error.syscall !== 'listen') throw error;
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ ERRO FATAL: A porta ${listenPort} já está em uso.`);
        (process as any).exit(1);
    } else {
        throw error;
    }
});

server.listen(listenPort, '0.0.0.0', () => {
    const logMessage = isProduction ? `
        ################################################
        👑 API REST DEDICADA LIVEGO - ONLINE (PROD - HTTP)
        🔒 PORTA INTERNA: ${listenPort}
        ################################################
        ` : `
        ################################################
        🔧 API REST DEDICADA LIVEGO - MODO DESENVOLVIMENTO
        ⚡️ PORTA: ${listenPort}
        ################################################
        `;
    console.log(logMessage);
});