import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// FIX: Corrected dotenv path. `dotenv.config()` automatically looks for the .env file in the current working directory (the project root), which is the correct behavior. The previous path was looking for the file one directory above the project root.
dotenv.config();
if (!process.env.PORT || !process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.error("ERRO CRÍTICO: Arquivo .env não carregado ou incompleto.");
    process.exit(1);
}
// FIX: Change to a namespace-style import to avoid type conflicts with global DOM types.
import express from 'express';
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
    process.exit(1);
});
// FIX: Use express() which is the correct way to create an express app.
const app = express();
const isProduction = config.node_env === 'production';
app.use(cors());
// FIX: Use express.json() which is a built-in middleware.
app.use(express.json({ limit: '10mb' }));
// Global request logger middleware
// FIX: Use express.Request, express.Response, and express.NextFunction to avoid type ambiguity.
app.use((req, res, next) => {
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
// FIX: Use express.Request, express.Response, and express.NextFunction to avoid type ambiguity.
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use('/api', apiRoutes);
app.use('/api', srsRoutes);
app.use('/api', livekitRoutes);
// FIX: Use express.Request and express.Response types.
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
// FIX: Use express.Request and express.Response types.
app.get('/', (req, res) => {
    res.send(`<h1>Servidor LiveGo Online (HTTP)</h1><p>API em: <a href="/api/status">/api/status</a></p>`);
});
app.use(globalErrorHandler);
const listenPort = config.port;
server.on('error', (error) => {
    if (error.syscall !== 'listen')
        throw error;
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ ERRO FATAL: A porta ${listenPort} já está em uso.`);
        process.exit(1);
    }
    else {
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
