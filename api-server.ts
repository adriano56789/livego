import express from 'express';
import cors from 'cors';
import { mockApiRouter } from './services/server';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { webSocketServerInstance } from './services/websocket';

declare module './services/websocket' {
  interface SimulatedWebSocketServer {
    handleMessage(ws: WebSocket, data: any): void;
    handleDisconnect(ws: WebSocket): void;
  }
}

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rota da API
app.all('/api/*', async (req, res) => {
  try {
    const { status, data, error } = await mockApiRouter(
      req.method,
      req.path.replace(/^\/api/, ''),
      req.body
    );
    
    res.status(status).json(data || { error });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cria o servidor HTTP
const server = createServer(app);

// Configura o WebSocket
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('Novo cliente WebSocket conectado');
  
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      webSocketServerInstance.handleMessage(ws as any, data);
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  });

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
    // Get the user ID from the WebSocket object or connection tracking
    // For now, we'll just log the disconnection
    // You might want to implement proper user tracking to get the user ID
    webSocketServerInstance.disconnect(ws as any);
  });
});

// Inicia o servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📡 WebSocket rodando em ws://localhost:${PORT}`);
});

export default server;
