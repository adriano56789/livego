const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const { connectToDatabase } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao banco de dados
let db;
connectToDatabase().then(database => {
  db = database;
  console.log('Banco de dados conectado!');
}).catch(error => {
  console.error('Erro ao conectar ao banco:', error);
});

// WebSocket para atualizações em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('join-stream', (streamId) => {
    socket.join(`stream-${streamId}`);
    console.log(`Cliente ${socket.id} entrou na stream ${streamId}`);
  });
  
  socket.on('leave-stream', (streamId) => {
    socket.leave(`stream-${streamId}`);
    console.log(`Cliente ${socket.id} saiu da stream ${streamId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Função para emitir atualizações via WebSocket
function emitUpdate(event, data, streamId = null) {
  if (streamId) {
    io.to(`stream-${streamId}`).emit(event, data);
  } else {
    io.emit(event, data);
  }
}

// Rotas da API

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Obter usuário por ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await db.collection('users').findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar streams ao vivo
app.get('/api/streams', async (req, res) => {
  try {
    const streams = await db.collection('streams').find({ ao_vivo: true }).toArray();
    res.json(streams);
  } catch (error) {
    console.error('Erro ao buscar streams:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter detalhes de uma stream
app.get('/api/streams/:id', async (req, res) => {
  try {
    const streamId = req.params.id;
    const stream = await db.collection('streams').findOne({ id: streamId });
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream não encontrada' });
    }
    
    res.json(stream);
  } catch (error) {
    console.error('Erro ao buscar stream:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova stream
app.post('/api/streams', async (req, res) => {
  try {
    const streamData = {
      ...req.body,
      id: `stream_${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date(),
      ao_vivo: true,
      current_viewers: []
    };
    
    const result = await db.collection('streams').insertOne(streamData);
    
    // Emitir atualização via WebSocket
    emitUpdate('new-stream', streamData);
    
    res.status(201).json(streamData);
  } catch (error) {
    console.error('Erro ao criar stream:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Entrar em uma stream
app.post('/api/streams/:id/join', async (req, res) => {
  try {
    const streamId = req.params.id;
    const { userId } = req.body;
    
    const result = await db.collection('streams').updateOne(
      { id: streamId },
      { 
        $addToSet: { current_viewers: userId },
        $set: { updated_at: new Date() }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Stream não encontrada' });
    }
    
    // Emitir atualização via WebSocket
    emitUpdate('viewer-joined', { userId, streamId }, streamId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao entrar na stream:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Sair de uma stream
app.post('/api/streams/:id/leave', async (req, res) => {
  try {
    const streamId = req.params.id;
    const { userId } = req.body;
    
    const result = await db.collection('streams').updateOne(
      { id: streamId },
      { 
        $pull: { current_viewers: userId },
        $set: { updated_at: new Date() }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Stream não encontrada' });
    }
    
    // Emitir atualização via WebSocket
    emitUpdate('viewer-left', { userId, streamId }, streamId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao sair da stream:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem no chat
app.post('/api/streams/:id/chat', async (req, res) => {
  try {
    const streamId = req.params.id;
    const { userId, message } = req.body;
    
    const chatMessage = {
      id: `msg_${Date.now()}`,
      userId,
      message,
      timestamp: new Date().toISOString(),
      streamId
    };
    
    // Salvar mensagem no banco
    await db.collection('chat_messages').insertOne(chatMessage);
    
    // Emitir mensagem via WebSocket
    emitUpdate('new-chat-message', chatMessage, streamId);
    
    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter mensagens do chat
app.get('/api/streams/:id/chat', async (req, res) => {
  try {
    const streamId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await db.collection('chat_messages')
      .find({ streamId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar presentes
app.get('/api/gifts', async (req, res) => {
  try {
    const gifts = await db.collection('gifts').find({}).toArray();
    res.json(gifts);
  } catch (error) {
    console.error('Erro ao buscar presentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar presente
app.post('/api/gifts/send', async (req, res) => {
  try {
    const { fromUserId, toUserId, giftId, streamId } = req.body;
    
    const gift = await db.collection('gifts').findOne({ id: giftId });
    if (!gift) {
      return res.status(404).json({ error: 'Presente não encontrado' });
    }
    
    const giftTransaction = {
      id: `gift_${Date.now()}`,
      fromUserId,
      toUserId,
      giftId,
      streamId,
      cost: gift.diamond_cost,
      timestamp: new Date().toISOString()
    };
    
    // Salvar transação
    await db.collection('gift_transactions').insertOne(giftTransaction);
    
    // Atualizar saldo dos usuários
    await db.collection('users').updateOne(
      { id: fromUserId },
      { $inc: { wallet_diamonds: -gift.diamond_cost } }
    );
    
    await db.collection('users').updateOne(
      { id: toUserId },
      { $inc: { wallet_earnings: gift.diamond_cost } }
    );
    
    // Emitir atualização via WebSocket
    emitUpdate('gift-sent', { ...giftTransaction, gift }, streamId);
    
    res.status(201).json(giftTransaction);
  } catch (error) {
    console.error('Erro ao enviar presente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`WebSocket disponível em ws://localhost:${PORT}`);
});

module.exports = { app, io, emitUpdate };
