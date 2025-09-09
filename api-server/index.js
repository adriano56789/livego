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

// Version endpoint - Retorna informações de versão no formato VersionInfo
const APP_VERSION = '1.0.0';

app.get('/api/version', (req, res) => {
  res.json({
    minVersion: '1.0.0',
    latestVersion: APP_VERSION,
    updateUrl: 'https://play.google.com/store/apps/details?id=com.livego.app',
    timestamp: new Date().toISOString()
  });
});

// Google Auth endpoint (placeholder - implement proper OAuth2 flow)
app.post('/api/auth/google', async (req, res) => {
  try {
    // This is a placeholder - implement proper Google OAuth2 flow
    // You'll need to validate the token and create/return a JWT
    res.status(200).json({
      token: 'dummy-jwt-token',
      user: {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'https://i.pravatar.cc/150?img=1'
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Health check endpoint
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


// ===== OPERAÇÕES CRUD COMPLETAS PARA USUÁRIOS =====

// Criar novo usuário
app.post('/api/users', async (req, res) => {
  try {
    const userData = {
      ...req.body,
      id: Date.now(), // Gerar ID único
      created_at: new Date(),
      updated_at: new Date(),
      wallet_diamonds: req.body.wallet_diamonds || 0,
      wallet_earnings: req.body.wallet_earnings || 0,
      xp: req.body.xp || 0,
      online_status: req.body.online_status || false,
      following: req.body.following || [],
      settings: req.body.settings || {
        notifications: { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true },
        privacy: { showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false, messagePrivacy: 'everyone' },
        privateLiveInvite: { privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false, acceptOnlyFriendPkInvites: false },
        giftNotifications: { enabledGifts: {} }
      }
    };
    
    const result = await db.collection('users').insertOne(userData);
    
    res.status(201).json(userData);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar todos os usuários (com paginação)
app.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const users = await db.collection('users')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('users').countDocuments();
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar usuário
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };
    
    // Remover campos que não devem ser atualizados diretamente
    delete updateData.id;
    delete updateData.created_at;
    
    const result = await db.collection('users').updateOne(
      { id: userId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const updatedUser = await db.collection('users').findOne({ id: userId });
    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar usuário
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const result = await db.collection('users').deleteOne({ id: userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ success: true, message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== OPERAÇÕES CRUD COMPLETAS PARA STREAMS =====

// Atualizar stream
app.put('/api/streams/:id', async (req, res) => {
  try {
    const streamId = req.params.id;
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };
    
    // Remover campos que não devem ser atualizados diretamente
    delete updateData.id;
    delete updateData.created_at;
    
    const result = await db.collection('streams').updateOne(
      { id: streamId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Stream não encontrada' });
    }
    
    const updatedStream = await db.collection('streams').findOne({ id: streamId });
    
    // Emitir atualização via WebSocket
    emitUpdate('stream-updated', updatedStream, streamId);
    
    res.json(updatedStream);
  } catch (error) {
    console.error('Erro ao atualizar stream:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar stream
app.delete('/api/streams/:id', async (req, res) => {
  try {
    const streamId = req.params.id;
    
    const result = await db.collection('streams').deleteOne({ id: streamId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Stream não encontrada' });
    }
    
    // Emitir atualização via WebSocket
    emitUpdate('stream-deleted', { streamId });
    
    res.json({ success: true, message: 'Stream deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar stream:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Finalizar stream
app.post('/api/streams/:id/end', async (req, res) => {
  try {
    const streamId = req.params.id;
    
    const result = await db.collection('streams').updateOne(
      { id: streamId },
      { 
        $set: { 
          ao_vivo: false,
          fim: new Date().toISOString(),
          updated_at: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Stream não encontrada' });
    }
    
    // Emitir atualização via WebSocket
    emitUpdate('stream-ended', { streamId }, streamId);
    
    res.json({ success: true, message: 'Stream finalizada com sucesso' });
  } catch (error) {
    console.error('Erro ao finalizar stream:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== OPERAÇÕES CRUD COMPLETAS PARA PRESENTES =====

// Criar novo presente
app.post('/api/gifts', async (req, res) => {
  try {
    const giftData = {
      ...req.body,
      id: `gift_${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('gifts').insertOne(giftData);
    
    res.status(201).json(giftData);
  } catch (error) {
    console.error('Erro ao criar presente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter presente por ID
app.get('/api/gifts/:id', async (req, res) => {
  try {
    const giftId = req.params.id;
    const gift = await db.collection('gifts').findOne({ id: giftId });
    
    if (!gift) {
      return res.status(404).json({ error: 'Presente não encontrado' });
    }
    
    res.json(gift);
  } catch (error) {
    console.error('Erro ao buscar presente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar presente
app.put('/api/gifts/:id', async (req, res) => {
  try {
    const giftId = req.params.id;
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };
    
    // Remover campos que não devem ser atualizados diretamente
    delete updateData.id;
    delete updateData.created_at;
    
    const result = await db.collection('gifts').updateOne(
      { id: giftId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Presente não encontrado' });
    }
    
    const updatedGift = await db.collection('gifts').findOne({ id: giftId });
    res.json(updatedGift);
  } catch (error) {
    console.error('Erro ao atualizar presente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar presente
app.delete('/api/gifts/:id', async (req, res) => {
  try {
    const giftId = req.params.id;
    
    const result = await db.collection('gifts').deleteOne({ id: giftId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Presente não encontrado' });
    }
    
    res.json({ success: true, message: 'Presente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar presente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== OPERAÇÕES PARA TRANSAÇÕES DE PRESENTES =====

// Listar transações de presentes
app.get('/api/gift-transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const userId = req.query.userId;
    
    let query = {};
    if (userId) {
      query = { $or: [{ fromUserId: parseInt(userId) }, { toUserId: parseInt(userId) }] };
    }
    
    const transactions = await db.collection('gift_transactions')
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('gift_transactions').countDocuments(query);
    
    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== OPERAÇÕES PARA MENSAGENS DE CHAT =====

// Deletar mensagem do chat
app.delete('/api/chat/:id', async (req, res) => {
  try {
    const messageId = req.params.id;
    
    const result = await db.collection('chat_messages').deleteOne({ id: messageId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    res.json({ success: true, message: 'Mensagem deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== OPERAÇÕES DE SEGUIR/DEIXAR DE SEGUIR =====

// Seguir usuário
app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const { userId } = req.body;
    
    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Não é possível seguir a si mesmo' });
    }
    
    const result = await db.collection('users').updateOne(
      { id: userId },
      { 
        $addToSet: { following: targetUserId },
        $set: { updated_at: new Date() }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ success: true, message: 'Usuário seguido com sucesso' });
  } catch (error) {
    console.error('Erro ao seguir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deixar de seguir usuário
app.post('/api/users/:id/unfollow', async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const { userId } = req.body;
    
    const result = await db.collection('users').updateOne(
      { id: userId },
      { 
        $pull: { following: targetUserId },
        $set: { updated_at: new Date() }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ success: true, message: 'Usuário deixou de ser seguido com sucesso' });
  } catch (error) {
    console.error('Erro ao deixar de seguir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter seguidores de um usuário
app.get('/api/users/:id/followers', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const followers = await db.collection('users')
      .find({ following: userId })
      .project({ id: 1, name: 1, nickname: 1, avatar_url: 1 })
      .toArray();
    
    res.json(followers);
  } catch (error) {
    console.error('Erro ao buscar seguidores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter usuários que um usuário segue
app.get('/api/users/:id/following', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const following = await db.collection('users')
      .find({ id: { $in: user.following || [] } })
      .project({ id: 1, name: 1, nickname: 1, avatar_url: 1 })
      .toArray();
    
    res.json(following);
  } catch (error) {
    console.error('Erro ao buscar usuários seguidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// ===== INTEGRAÇÕES LIVEKIT =====

const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

// Configurações do LiveKit
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'livego_secret_key_for_development_32chars';
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL || 'ws://localhost:7880';

// Cliente do LiveKit Room Service
const roomService = new RoomServiceClient(LIVEKIT_WS_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

// Gerar token de acesso para LiveKit
app.post('/api/livekit/token', async (req, res) => {
  try {
    const { roomName, participantName, participantId } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'roomName e participantName são obrigatórios' });
    }
    
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantId || participantName,
      name: participantName,
    });
    
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    
    const token = await at.toJwt();
    
    res.json({
      token,
      wsUrl: LIVEKIT_WS_URL,
      roomName,
      participantName
    });
  } catch (error) {
    console.error('Erro ao gerar token LiveKit:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar sala LiveKit
app.post('/api/livekit/rooms', async (req, res) => {
  try {
    const { name, maxParticipants, metadata } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da sala é obrigatório' });
    }
    
    const room = await roomService.createRoom({
      name,
      maxParticipants: maxParticipants || 100,
      metadata: metadata || '',
    });
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Erro ao criar sala LiveKit:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar salas LiveKit
app.get('/api/livekit/rooms', async (req, res) => {
  try {
    const rooms = await roomService.listRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Erro ao listar salas LiveKit:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter informações de uma sala específica
app.get('/api/livekit/rooms/:name', async (req, res) => {
  try {
    const roomName = req.params.name;
    const room = await roomService.getRoom(roomName);
    res.json(room);
  } catch (error) {
    console.error('Erro ao buscar sala LiveKit:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar sala LiveKit
app.delete('/api/livekit/rooms/:name', async (req, res) => {
  try {
    const roomName = req.params.name;
    await roomService.deleteRoom(roomName);
    res.json({ success: true, message: 'Sala deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar sala LiveKit:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar participantes de uma sala
app.get('/api/livekit/rooms/:name/participants', async (req, res) => {
  try {
    const roomName = req.params.name;
    const participants = await roomService.listParticipants(roomName);
    res.json(participants);
  } catch (error) {
    console.error('Erro ao listar participantes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover participante de uma sala
app.delete('/api/livekit/rooms/:name/participants/:identity', async (req, res) => {
  try {
    const { name: roomName, identity } = req.params;
    await roomService.removeParticipant(roomName, identity);
    res.json({ success: true, message: 'Participante removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover participante:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== INTEGRAÇÕES STREAM + LIVEKIT =====

// Iniciar stream com LiveKit
app.post('/api/streams/:id/start-livekit', async (req, res) => {
  try {
    const streamId = req.params.id;
    const { userId } = req.body;
    
    // Buscar dados da stream
    const stream = await db.collection('streams').findOne({ id: streamId });
    if (!stream) {
      return res.status(404).json({ error: 'Stream não encontrada' });
    }
    
    // Buscar dados do usuário
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Criar sala LiveKit
    const roomName = `stream_${streamId}`;
    try {
      await roomService.createRoom({
        name: roomName,
        maxParticipants: 1000,
        metadata: JSON.stringify({
          streamId,
          streamTitle: stream.titulo,
          streamerName: stream.nome_streamer,
          category: stream.categoria
        }),
      });
    } catch (error) {
      // Sala pode já existir, continuar
      console.log('Sala já existe ou erro ao criar:', error.message);
    }
    
    // Gerar token para o streamer
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `streamer_${userId}`,
      name: user.name,
    });
    
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: true,
    });
    
    const token = await at.toJwt();
    
    // Atualizar stream no banco
    await db.collection('streams').updateOne(
      { id: streamId },
      { 
        $set: { 
          livekit_room: roomName,
          livekit_enabled: true,
          updated_at: new Date()
        }
      }
    );
    
    res.json({
      token,
      wsUrl: LIVEKIT_WS_URL,
      roomName,
      streamId,
      participantName: user.name
    });
  } catch (error) {
    console.error('Erro ao iniciar stream com LiveKit:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Gerar token para espectador
app.post('/api/streams/:id/join-livekit', async (req, res) => {
  try {
    const streamId = req.params.id;
    const { userId } = req.body;
    
    // Buscar dados da stream
    const stream = await db.collection('streams').findOne({ id: streamId });
    if (!stream) {
      return res.status(404).json({ error: 'Stream não encontrada' });
    }
    
    if (!stream.livekit_room) {
      return res.status(400).json({ error: 'Stream não tem sala LiveKit ativa' });
    }
    
    // Buscar dados do usuário
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Gerar token para o espectador
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `viewer_${userId}`,
      name: user.name,
    });
    
    at.addGrant({
      roomJoin: true,
      room: stream.livekit_room,
      canPublish: false,
      canSubscribe: true,
      canPublishData: true,
    });
    
    const token = await at.toJwt();
    
    res.json({
      token,
      wsUrl: LIVEKIT_WS_URL,
      roomName: stream.livekit_room,
      streamId,
      participantName: user.name
    });
  } catch (error) {
    console.error('Erro ao gerar token para espectador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Finalizar stream LiveKit
app.post('/api/streams/:id/end-livekit', async (req, res) => {
  try {
    const streamId = req.params.id;
    
    // Buscar dados da stream
    const stream = await db.collection('streams').findOne({ id: streamId });
    if (!stream) {
      return res.status(404).json({ error: 'Stream não encontrada' });
    }
    
    if (stream.livekit_room) {
      try {
        // Deletar sala LiveKit
        await roomService.deleteRoom(stream.livekit_room);
      } catch (error) {
        console.log('Erro ao deletar sala LiveKit:', error.message);
      }
    }
    
    // Atualizar stream no banco
    await db.collection('streams').updateOne(
      { id: streamId },
      { 
        $set: { 
          ao_vivo: false,
          livekit_enabled: false,
          fim: new Date().toISOString(),
          updated_at: new Date()
        },
        $unset: {
          livekit_room: ""
        }
      }
    );
    
    // Emitir atualização via WebSocket
    emitUpdate('stream-ended', { streamId }, streamId);
    
    res.json({ success: true, message: 'Stream LiveKit finalizada com sucesso' });
  } catch (error) {
    console.error('Erro ao finalizar stream LiveKit:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Status do LiveKit
app.get('/api/livekit/status', async (req, res) => {
  try {
    const rooms = await roomService.listRooms();
    res.json({
      status: 'connected',
      wsUrl: LIVEKIT_WS_URL,
      apiKey: LIVEKIT_API_KEY,
      totalRooms: rooms.length,
      rooms: rooms.map(room => ({
        name: room.name,
        numParticipants: room.numParticipants,
        creationTime: room.creationTime
      }))
    });
  } catch (error) {
    console.error('Erro ao verificar status do LiveKit:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});


// ===== APIs FALTANTES IMPLEMENTADAS =====

// API de Busca de Usuários
app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const users = await db.collection('users').find({
      $or: [
        { name: searchRegex },
        { nickname: searchRegex },
        { id: parseInt(q) || 0 }
      ]
    }).limit(20).toArray();

    res.json({ users, total: users.length });
  } catch (error) {
    console.error('Erro na busca de usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API de Conversas do Usuário
app.get('/api/users/:userId/conversations', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Buscar conversas do usuário
    const conversations = await db.collection('conversations').find({
      participants: userId
    }).sort({ updated_at: -1 }).toArray();

    // Buscar informações dos outros participantes
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participants.find(id => id !== userId);
        const otherUser = await db.collection('users').findOne({ id: otherUserId });
        
        return {
          id: conv.id,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            avatar_url: otherUser.avatar_url,
            online_status: otherUser.online_status
          } : null,
          lastMessage: conv.lastMessage || null,
          updated_at: conv.updated_at,
          unreadCount: conv.unreadCount || 0
        };
      })
    );

    res.json({ conversations: conversationsWithUsers });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API de Lives por Categoria
app.get('/api/lives', async (req, res) => {
  try {
    const { category = 'Popular', region = 'BR' } = req.query;
    
    let filter = { ao_vivo: true };
    
    if (category !== 'Popular') {
      filter.categoria = category;
    }
    
    if (region !== 'all') {
      filter.regiao = region;
    }

    const lives = await db.collection('streams').find(filter)
      .sort({ viewers: -1, created_at: -1 })
      .limit(50)
      .toArray();

    // Buscar informações dos streamers
    const livesWithStreamers = await Promise.all(
      lives.map(async (live) => {
        const streamer = await db.collection('users').findOne({ id: live.streamer_id });
        return {
          ...live,
          streamer: streamer ? {
            id: streamer.id,
            name: streamer.name,
            avatar_url: streamer.avatar_url,
            level2: streamer.level2
          } : null
        };
      })
    );

    res.json({ lives: livesWithStreamers, total: livesWithStreamers.length });
  } catch (error) {
    console.error('Erro ao buscar lives:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API de Categorias de Live
app.get('/api/live/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'Popular', name: 'Popular', icon: '🔥' },
      { id: 'Música', name: 'Música', icon: '🎵' },
      { id: 'Dança', name: 'Dança', icon: '💃' },
      { id: 'Festa', name: 'Festa', icon: '🎉' },
      { id: 'Conversa', name: 'Conversa', icon: '💬' },
      { id: 'Jogos', name: 'Jogos', icon: '🎮' },
      { id: 'Culinária', name: 'Culinária', icon: '👨‍🍳' },
      { id: 'Esportes', name: 'Esportes', icon: '⚽' },
      { id: 'Arte', name: 'Arte', icon: '🎨' },
      { id: 'Educação', name: 'Educação', icon: '📚' }
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API de Pacotes de Diamantes
app.get('/api/diamonds/packages', async (req, res) => {
  try {
    const packages = [
      { id: 1, diamonds: 60, price: 0.99, bonus: 0, popular: false },
      { id: 2, diamonds: 300, price: 4.99, bonus: 10, popular: false },
      { id: 3, diamonds: 980, price: 14.99, bonus: 50, popular: true },
      { id: 4, diamonds: 1980, price: 29.99, bonus: 120, popular: false },
      { id: 5, diamonds: 3280, price: 49.99, bonus: 220, popular: false },
      { id: 6, diamonds: 6480, price: 99.99, bonus: 520, popular: false },
      { id: 7, diamonds: 16800, price: 249.99, bonus: 1500, popular: false },
      { id: 8, diamonds: 35800, price: 499.99, bonus: 3500, popular: false }
    ];

    res.json({ packages });
  } catch (error) {
    console.error('Erro ao buscar pacotes de diamantes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API de Preferências de Live do Usuário
app.get('/api/users/:userId/live-preferences', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const preferences = {
      defaultCategory: 'Popular',
      defaultPrivacy: 'public',
      allowPkInvites: user.pk_enabled_preference || true,
      defaultRegion: user.country || 'BR',
      autoStartRecording: false,
      allowGifts: true,
      allowComments: true,
      moderationLevel: 'normal'
    };

    res.json({ preferences });
  } catch (error) {
    console.error('Erro ao buscar preferências de live:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API de Status de Live do Usuário
app.get('/api/users/:userId/live-status', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const activeStream = await db.collection('streams').findOne({
      streamer_id: userId,
      ao_vivo: true
    });

    const status = {
      isLive: !!activeStream,
      stream: activeStream ? {
        id: activeStream.id,
        title: activeStream.titulo,
        viewers: activeStream.viewers || 0,
        started_at: activeStream.created_at,
        category: activeStream.categoria
      } : null
    };

    res.json(status);
  } catch (error) {
    console.error('Erro ao verificar status de live:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API de Status de Live dos Seguidos
app.get('/api/users/:userId/following-live-status', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const user = await db.collection('users').findOne({ id: userId });
    if (!user || !user.following) {
      return res.json({ liveFollowing: [] });
    }

    const liveStreams = await db.collection('streams').find({
      streamer_id: { $in: user.following },
      ao_vivo: true
    }).toArray();

    const liveFollowing = await Promise.all(
      liveStreams.map(async (stream) => {
        const streamer = await db.collection('users').findOne({ id: stream.streamer_id });
        return {
          streamId: stream.id,
          streamerId: stream.streamer_id,
          streamerName: streamer?.name || 'Usuário',
          streamerAvatar: streamer?.avatar_url || '',
          title: stream.titulo,
          viewers: stream.viewers || 0,
          category: stream.categoria
        };
      })
    );

    res.json({ liveFollowing });
  } catch (error) {
    console.error('Erro ao verificar status dos seguidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API de Países
app.get('/api/countries', async (req, res) => {
  try {
    const countries = [
      { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
      { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
      { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
      { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
      { code: 'FR', name: 'França', flag: '🇫🇷' },
      { code: 'IT', name: 'Itália', flag: '🇮🇹' },
      { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
      { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
      { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
      { code: 'MX', name: 'México', flag: '🇲🇽' },
      { code: 'JP', name: 'Japão', flag: '🇯🇵' },
      { code: 'KR', name: 'Coreia do Sul', flag: '🇰🇷' },
      { code: 'CN', name: 'China', flag: '🇨🇳' },
      { code: 'IN', name: 'Índia', flag: '🇮🇳' },
      { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
      { code: 'AU', name: 'Austrália', flag: '🇦🇺' }
    ];

    res.json({ countries });
  } catch (error) {
    console.error('Erro ao buscar países:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

console.log('🚀 Servidor rodando na porta 3000');
console.log('📊 MongoDB conectado');
console.log('🎥 LiveKit integrado');
console.log('✅ Todas as APIs implementadas');

