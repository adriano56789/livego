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
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
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

// ===== API DE BUSCA =====
app.get('/api/users/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Criar regex para busca case-insensitive
    const searchRegex = new RegExp(query, 'i');
    
    // Buscar usuários que correspondam à query no nome, username ou ID
    const users = await db.collection('users')
      .find({
        $or: [
          { nome: { $regex: searchRegex } },
          { username: { $regex: searchRegex } },
          { id: isNaN(query) ? 0 : parseInt(query) }
        ]
      })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        nome: user.nome,
        username: user.username,
        foto_perfil: user.foto_perfil,
        nivel: user.nivel || 1,
        online: user.online || false
      })),
      pagination: {
        page,
        limit,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Erro na busca de usuários:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar usuários' });
  }
});

// ===== API DE CONVERSAS =====
app.get('/api/users/:userId/conversations', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Buscar conversas do usuário
    const conversations = await db.collection('conversations')
      .find({
        participants: userId
      })
      .sort({ last_message_at: -1 })
      .toArray();

    // Adicionar informações dos participantes
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participants.find(id => id !== userId);
        const otherUser = await db.collection('users').findOne({ id: otherParticipantId });
        
        return {
          id: conv.id,
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: conv.unread_count || 0,
          participant: otherUser ? {
            id: otherUser.id,
            nome: otherUser.nome,
            username: otherUser.username,
            foto_perfil: otherUser.foto_perfil,
            online: otherUser.online || false
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithDetails
    });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar conversas' });
  }
});

// ===== API DE CATEGORIAS DE LIVE =====
app.get('/api/live/categories', async (req, res) => {
  try {
    // Categorias fixas para o aplicativo
    const categories = [
      { id: 'popular', nome: 'Popular', icone: '🔥' },
      { id: 'seguindo', nome: 'Seguindo', icone: '👥', requiresAuth: true },
      { id: 'perto', nome: 'Perto de você', icone: '📍', requiresLocation: true },
      { id: 'privada', nome: 'Privada', icone: '🔒' },
      { id: 'pk', nome: 'PK', icone: '🥊' },
      { id: 'novo', nome: 'Novo', icone: '🆕' },
      { id: 'musica', nome: 'Música', icone: '🎵' },
      { id: 'danca', nome: 'Dança', icone: '💃' },
      { id: 'festa', nome: 'Festa', icone: '🎉' },
      { id: 'jogos', nome: 'Jogos', icone: '🎮' },
      { id: 'esportes', nome: 'Esportes', icone: '⚽' },
      { id: 'educacao', nome: 'Educação', icone: '📚' },
      { id: 'culinaria', nome: 'Culinária', icone: '🍳' },
      { id: 'beleza', nome: 'Beleza', icone: '💄' },
      { id: 'moda', nome: 'Moda', icone: '👗' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar categorias' });
  }
});

// ===== API DE PACOTES DE DIAMANTES =====
app.get('/api/diamonds/packages', async (req, res) => {
  try {
    // Pacotes de diamantes fixos
    const packages = [
      { id: 1, diamantes: 100, preco: 4.99, desconto: 0, moeda: 'BRL', mais_vendido: false },
      { id: 2, diamantes: 310, preco: 14.99, desconto: 10, moeda: 'BRL', mais_vendido: true },
      { id: 3, diamantes: 520, preco: 24.99, desconto: 15, moeda: 'BRL', mais_vendido: false },
      { id: 4, diamantes: 1100, preco: 49.99, desconto: 20, moeda: 'BRL', mais_vendido: false },
      { id: 5, diamantes: 2300, preco: 99.99, desconto: 25, moeda: 'BRL', mais_vendido: false },
      { id: 6, diamantes: 4800, preco: 199.99, desconto: 30, moeda: 'BRL', mais_vendido: false }
    ];

    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Erro ao buscar pacotes de diamantes:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar pacotes de diamantes' });
  }
});

// ===== API DE PREFERÊNCIAS DE LIVE =====
app.get('/api/users/:userId/live-preferences', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Buscar preferências do usuário
    const user = await db.collection('users').findOne({ id: userId });
    
    // Preferências padrão
    const defaultPreferences = {
      qualidade: 'auto', // auto, 720p, 1080p
      notificacoes: true,
      mensagens_privadas: true,
      comentarios_live: true,
      idioma: 'pt-BR',
      tema: 'claro', // claro, escuro, sistema
      salvar_gravacoes: true,
      idade_verificada: false,
      privacidade: 'publico' // publico, seguidores, ninguem
    };
    
    // Mesclar com preferências salvas, se existirem
    const preferences = user?.preferences ? { ...defaultPreferences, ...user.preferences } : defaultPreferences;
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Erro ao buscar preferências de live:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar preferências de live' });
  }
});

// ===== API DE STATUS DE LIVE =====
app.get('/api/users/:userId/live-status', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Verificar se o usuário está em uma live ativa
    const live = await db.collection('lives').findOne({ 
      user_id: userId,
      status: 'live'
    });
    
    if (live) {
      res.json({
        success: true,
        is_live: true,
        live_id: live.id,
        started_at: live.started_at,
        viewer_count: live.viewer_count || 0,
        thumbnail: live.thumbnail || null
      });
    } else {
      res.json({
        success: true,
        is_live: false
      });
    }
  } catch (error) {
    console.error('Erro ao verificar status de live:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar status de live' });
  }
});

// ===== API DE PAÍSES =====
app.get('/api/countries', async (req, res) => {
  try {
    // Lista de países com código e nome em português
    const countries = [
      { code: 'BR', name: 'Brasil' },
      { code: 'PT', name: 'Portugal' },
      { code: 'US', name: 'Estados Unidos' },
      { code: 'ES', name: 'Espanha' },
      { code: 'FR', name: 'França' },
      { code: 'DE', name: 'Alemanha' },
      { code: 'IT', name: 'Itália' },
      { code: 'GB', name: 'Reino Unido' },
      { code: 'JP', name: 'Japão' },
      { code: 'CN', name: 'China' },
      { code: 'IN', name: 'Índia' },
      { code: 'RU', name: 'Rússia' },
      { code: 'CA', name: 'Canadá' },
      { code: 'AU', name: 'Austrália' },
      { code: 'MX', name: 'México' },
      { code: 'AR', name: 'Argentina' },
      { code: 'CL', name: 'Chile' },
      { code: 'CO', name: 'Colômbia' },
      { code: 'PE', name: 'Peru' },
      { code: 'VE', name: 'Venezuela' }
    ];
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Erro ao buscar países:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar países' });
  }
});

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


// ===== APIs DE PK (PLAYER KILL) - BATALHAS DE STREAMERS =====

// API para criar um convite de PK
app.post('/api/pk/invite', async (req, res) => {
  try {
    const { fromUserId, toUserId, streamId, message } = req.body;
    
    if (!fromUserId || !toUserId || !streamId) {
      return res.status(400).json({ error: 'fromUserId, toUserId e streamId são obrigatórios' });
    }

    // Verificar se o usuário remetente existe e está ao vivo
    const fromUser = await db.collection('users').findOne({ id: fromUserId });
    const toUser = await db.collection('users').findOne({ id: toUserId });
    const stream = await db.collection('streams').findOne({ id: streamId, ao_vivo: true });

    if (!fromUser || !toUser || !stream) {
      return res.status(404).json({ error: 'Usuário ou stream não encontrado' });
    }

    // Verificar se já existe um convite pendente
    const existingInvite = await db.collection('pk_invites').findOne({
      fromUserId,
      toUserId,
      status: 'pending'
    });

    if (existingInvite) {
      return res.status(400).json({ error: 'Já existe um convite pendente para este usuário' });
    }

    // Criar o convite
    const invite = {
      id: Date.now(),
      fromUserId,
      toUserId,
      streamId,
      message: message || 'Quer batalhar comigo?',
      status: 'pending', // pending, accepted, rejected, expired
      created_at: new Date(),
      expires_at: new Date(Date.now() + 30000) // 30 segundos para aceitar
    };

    await db.collection('pk_invites').insertOne(invite);

    // Emitir notificação via WebSocket
    io.to(`user-${toUserId}`).emit('pk-invite-received', {
      invite,
      fromUser: {
        id: fromUser.id,
        name: fromUser.name,
        avatar_url: fromUser.avatar_url,
        level2: fromUser.level2
      }
    });

    res.json({ success: true, invite });
  } catch (error) {
    console.error('Erro ao criar convite de PK:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para responder a um convite de PK
app.post('/api/pk/invite/:inviteId/respond', async (req, res) => {
  try {
    const inviteId = parseInt(req.params.inviteId);
    const { response, userId } = req.body; // response: 'accept' ou 'reject'
    
    if (!response || !userId) {
      return res.status(400).json({ error: 'response e userId são obrigatórios' });
    }

    // Buscar o convite
    const invite = await db.collection('pk_invites').findOne({ id: inviteId });
    
    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (invite.toUserId !== userId) {
      return res.status(403).json({ error: 'Você não pode responder a este convite' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Este convite já foi respondido ou expirou' });
    }

    // Verificar se o convite não expirou
    if (new Date() > new Date(invite.expires_at)) {
      await db.collection('pk_invites').updateOne(
        { id: inviteId },
        { $set: { status: 'expired', updated_at: new Date() } }
      );
      return res.status(400).json({ error: 'Este convite expirou' });
    }

    // Atualizar o status do convite
    const newStatus = response === 'accept' ? 'accepted' : 'rejected';
    await db.collection('pk_invites').updateOne(
      { id: inviteId },
      { $set: { status: newStatus, updated_at: new Date() } }
    );

    if (response === 'accept') {
      // Criar uma batalha PK
      const battle = {
        id: Date.now(),
        inviteId,
        player1: invite.fromUserId,
        player2: invite.toUserId,
        streamId: invite.streamId,
        status: 'active', // active, finished
        scores: { player1: 0, player2: 0 },
        duration: 60000, // 1 minuto
        started_at: new Date(),
        ends_at: new Date(Date.now() + 60000)
      };

      await db.collection('pk_battles').insertOne(battle);

      // Notificar ambos os usuários
      io.to(`user-${invite.fromUserId}`).emit('pk-battle-started', { battle });
      io.to(`user-${invite.toUserId}`).emit('pk-battle-started', { battle });
      
      // Notificar viewers da stream
      io.to(`stream-${invite.streamId}`).emit('pk-battle-started', { battle });

      res.json({ success: true, battle });
    } else {
      // Notificar o remetente que o convite foi rejeitado
      io.to(`user-${invite.fromUserId}`).emit('pk-invite-rejected', { inviteId });
      res.json({ success: true, message: 'Convite rejeitado' });
    }
  } catch (error) {
    console.error('Erro ao responder convite de PK:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para listar convites de PK do usuário
app.get('/api/users/:userId/pk-invites', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { type = 'received' } = req.query; // received, sent, all

    let filter = {};
    if (type === 'received') {
      filter.toUserId = userId;
    } else if (type === 'sent') {
      filter.fromUserId = userId;
    } else {
      filter = { $or: [{ fromUserId: userId }, { toUserId: userId }] };
    }

    const invites = await db.collection('pk_invites')
      .find(filter)
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    // Buscar informações dos usuários
    const invitesWithUsers = await Promise.all(
      invites.map(async (invite) => {
        const fromUser = await db.collection('users').findOne({ id: invite.fromUserId });
        const toUser = await db.collection('users').findOne({ id: invite.toUserId });
        
        return {
          ...invite,
          fromUser: fromUser ? {
            id: fromUser.id,
            name: fromUser.name,
            avatar_url: fromUser.avatar_url,
            level2: fromUser.level2
          } : null,
          toUser: toUser ? {
            id: toUser.id,
            name: toUser.name,
            avatar_url: toUser.avatar_url,
            level2: toUser.level2
          } : null
        };
      })
    );

    res.json({ invites: invitesWithUsers });
  } catch (error) {
    console.error('Erro ao buscar convites de PK:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para buscar batalhas PK ativas
app.get('/api/pk/battles/active', async (req, res) => {
  try {
    const battles = await db.collection('pk_battles')
      .find({ status: 'active', ends_at: { $gt: new Date() } })
      .sort({ started_at: -1 })
      .toArray();

    // Buscar informações dos players e streams
    const battlesWithDetails = await Promise.all(
      battles.map(async (battle) => {
        const player1 = await db.collection('users').findOne({ id: battle.player1 });
        const player2 = await db.collection('users').findOne({ id: battle.player2 });
        const stream = await db.collection('streams').findOne({ id: battle.streamId });
        
        return {
          ...battle,
          player1Info: player1 ? {
            id: player1.id,
            name: player1.name,
            avatar_url: player1.avatar_url,
            level2: player1.level2
          } : null,
          player2Info: player2 ? {
            id: player2.id,
            name: player2.name,
            avatar_url: player2.avatar_url,
            level2: player2.level2
          } : null,
          streamInfo: stream ? {
            id: stream.id,
            titulo: stream.titulo,
            viewers: stream.viewers
          } : null
        };
      })
    );

    res.json({ battles: battlesWithDetails });
  } catch (error) {
    console.error('Erro ao buscar batalhas PK ativas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para atualizar pontuação de uma batalha PK
app.post('/api/pk/battles/:battleId/score', async (req, res) => {
  try {
    const battleId = parseInt(req.params.battleId);
    const { playerId, points } = req.body;
    
    if (!playerId || points === undefined) {
      return res.status(400).json({ error: 'playerId e points são obrigatórios' });
    }

    const battle = await db.collection('pk_battles').findOne({ id: battleId });
    
    if (!battle) {
      return res.status(404).json({ error: 'Batalha não encontrada' });
    }

    if (battle.status !== 'active') {
      return res.status(400).json({ error: 'Esta batalha não está ativa' });
    }

    // Verificar se a batalha não terminou
    if (new Date() > new Date(battle.ends_at)) {
      await db.collection('pk_battles').updateOne(
        { id: battleId },
        { $set: { status: 'finished', updated_at: new Date() } }
      );
      return res.status(400).json({ error: 'Esta batalha já terminou' });
    }

    // Atualizar pontuação
    const scoreField = battle.player1 === playerId ? 'scores.player1' : 'scores.player2';
    await db.collection('pk_battles').updateOne(
      { id: battleId },
      { 
        $inc: { [scoreField]: points },
        $set: { updated_at: new Date() }
      }
    );

    // Buscar batalha atualizada
    const updatedBattle = await db.collection('pk_battles').findOne({ id: battleId });

    // Emitir atualização via WebSocket
    io.to(`stream-${battle.streamId}`).emit('pk-score-updated', { battle: updatedBattle });

    res.json({ success: true, battle: updatedBattle });
  } catch (error) {
    console.error('Erro ao atualizar pontuação da batalha PK:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para finalizar uma batalha PK
app.post('/api/pk/battles/:battleId/finish', async (req, res) => {
  try {
    const battleId = parseInt(req.params.battleId);
    
    const battle = await db.collection('pk_battles').findOne({ id: battleId });
    
    if (!battle) {
      return res.status(404).json({ error: 'Batalha não encontrada' });
    }

    if (battle.status !== 'active') {
      return res.status(400).json({ error: 'Esta batalha já foi finalizada' });
    }

    // Determinar o vencedor
    const winner = battle.scores.player1 > battle.scores.player2 ? battle.player1 : 
                   battle.scores.player2 > battle.scores.player1 ? battle.player2 : null;

    // Atualizar batalha
    await db.collection('pk_battles').updateOne(
      { id: battleId },
      { 
        $set: { 
          status: 'finished',
          winner,
          finished_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    // Buscar batalha atualizada
    const finishedBattle = await db.collection('pk_battles').findOne({ id: battleId });

    // Emitir resultado via WebSocket
    io.to(`stream-${battle.streamId}`).emit('pk-battle-finished', { battle: finishedBattle });
    io.to(`user-${battle.player1}`).emit('pk-battle-finished', { battle: finishedBattle });
    io.to(`user-${battle.player2}`).emit('pk-battle-finished', { battle: finishedBattle });

    res.json({ success: true, battle: finishedBattle });
  } catch (error) {
    console.error('Erro ao finalizar batalha PK:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

console.log('🥊 APIs de PK (Player Kill) implementadas');


// ===== APIs DE ROLETA DURANTE TRANSMISSÕES =====

// API para iniciar uma roleta na transmissão
app.post('/api/streams/:streamId/roulette/start', async (req, res) => {
  try {
    const streamId = parseInt(req.params.streamId);
    const { hostUserId, options, duration = 30, minBet = 10 } = req.body;
    
    if (!hostUserId || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'hostUserId e pelo menos 2 opções são obrigatórias' });
    }

    // Verificar se a stream existe e está ao vivo
    const stream = await db.collection('streams').findOne({ id: streamId, ao_vivo: true });
    if (!stream) {
      return res.status(404).json({ error: 'Stream não encontrada ou não está ao vivo' });
    }

    // Verificar se o usuário é o host da stream
    if (stream.user_id !== hostUserId) {
      return res.status(403).json({ error: 'Apenas o host pode iniciar uma roleta' });
    }

    // Verificar se já existe uma roleta ativa nesta stream
    const activeRoulette = await db.collection('roulettes').findOne({
      streamId,
      status: 'active'
    });

    if (activeRoulette) {
      return res.status(400).json({ error: 'Já existe uma roleta ativa nesta stream' });
    }

    // Criar a roleta
    const roulette = {
      id: Date.now(),
      streamId,
      hostUserId,
      title: req.body.title || 'Roleta da Sorte',
      options: options.map((option, index) => ({
        id: index,
        name: option,
        bets: [],
        totalAmount: 0
      })),
      status: 'active', // active, finished, cancelled
      duration: duration * 1000, // converter para milissegundos
      minBet,
      totalBets: 0,
      totalAmount: 0,
      created_at: new Date(),
      ends_at: new Date(Date.now() + (duration * 1000)),
      winner: null
    };

    await db.collection('roulettes').insertOne(roulette);

    // Emitir para todos os viewers da stream
    io.to(`stream-${streamId}`).emit('roulette-started', { roulette });

    res.json({ success: true, roulette });
  } catch (error) {
    console.error('Erro ao iniciar roleta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para fazer uma aposta na roleta
app.post('/api/roulette/:rouletteId/bet', async (req, res) => {
  try {
    const rouletteId = parseInt(req.params.rouletteId);
    const { userId, optionId, amount } = req.body;
    
    if (!userId || optionId === undefined || !amount || amount <= 0) {
      return res.status(400).json({ error: 'userId, optionId e amount são obrigatórios' });
    }

    // Buscar a roleta
    const roulette = await db.collection('roulettes').findOne({ id: rouletteId });
    if (!roulette) {
      return res.status(404).json({ error: 'Roleta não encontrada' });
    }

    if (roulette.status !== 'active') {
      return res.status(400).json({ error: 'Esta roleta não está ativa' });
    }

    // Verificar se a roleta não expirou
    if (new Date() > new Date(roulette.ends_at)) {
      await db.collection('roulettes').updateOne(
        { id: rouletteId },
        { $set: { status: 'finished', updated_at: new Date() } }
      );
      return res.status(400).json({ error: 'Esta roleta já terminou' });
    }

    // Verificar se a opção existe
    if (optionId >= roulette.options.length) {
      return res.status(400).json({ error: 'Opção inválida' });
    }

    // Verificar se o valor da aposta é válido
    if (amount < roulette.minBet) {
      return res.status(400).json({ error: `Aposta mínima é ${roulette.minBet} diamantes` });
    }

    // Verificar se o usuário tem diamantes suficientes
    const user = await db.collection('users').findOne({ id: userId });
    if (!user || user.diamonds < amount) {
      return res.status(400).json({ error: 'Diamantes insuficientes' });
    }

    // Verificar se o usuário já apostou nesta roleta
    const existingBet = roulette.options.some(option => 
      option.bets.some(bet => bet.userId === userId)
    );

    if (existingBet) {
      return res.status(400).json({ error: 'Você já apostou nesta roleta' });
    }

    // Debitar diamantes do usuário
    await db.collection('users').updateOne(
      { id: userId },
      { $inc: { diamonds: -amount } }
    );

    // Criar a aposta
    const bet = {
      userId,
      amount,
      created_at: new Date()
    };

    // Atualizar a roleta com a nova aposta
    await db.collection('roulettes').updateOne(
      { id: rouletteId },
      {
        $push: { [`options.${optionId}.bets`]: bet },
        $inc: { 
          [`options.${optionId}.totalAmount`]: amount,
          totalBets: 1,
          totalAmount: amount
        },
        $set: { updated_at: new Date() }
      }
    );

    // Buscar roleta atualizada
    const updatedRoulette = await db.collection('roulettes').findOne({ id: rouletteId });

    // Emitir atualização via WebSocket
    io.to(`stream-${roulette.streamId}`).emit('roulette-bet-placed', { 
      roulette: updatedRoulette,
      bet: { ...bet, optionId, userName: user.name }
    });

    res.json({ success: true, bet, roulette: updatedRoulette });
  } catch (error) {
    console.error('Erro ao fazer aposta na roleta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para finalizar uma roleta e sortear o vencedor
app.post('/api/roulette/:rouletteId/finish', async (req, res) => {
  try {
    const rouletteId = parseInt(req.params.rouletteId);
    
    const roulette = await db.collection('roulettes').findOne({ id: rouletteId });
    if (!roulette) {
      return res.status(404).json({ error: 'Roleta não encontrada' });
    }

    if (roulette.status !== 'active') {
      return res.status(400).json({ error: 'Esta roleta já foi finalizada' });
    }

    if (roulette.totalBets === 0) {
      // Cancelar roleta se não houver apostas
      await db.collection('roulettes').updateOne(
        { id: rouletteId },
        { $set: { status: 'cancelled', updated_at: new Date() } }
      );

      io.to(`stream-${roulette.streamId}`).emit('roulette-cancelled', { rouletteId });
      return res.json({ success: true, message: 'Roleta cancelada - nenhuma aposta foi feita' });
    }

    // Algoritmo de sorteio baseado no peso das apostas
    const totalWeight = roulette.totalAmount;
    const randomValue = Math.random() * totalWeight;
    
    let currentWeight = 0;
    let winningOption = null;
    
    for (let i = 0; i < roulette.options.length; i++) {
      currentWeight += roulette.options[i].totalAmount;
      if (randomValue <= currentWeight) {
        winningOption = i;
        break;
      }
    }

    // Se não encontrou vencedor (edge case), escolher a primeira opção com apostas
    if (winningOption === null) {
      winningOption = roulette.options.findIndex(option => option.totalAmount > 0);
    }

    // Calcular prêmios para os vencedores
    const winningOptionData = roulette.options[winningOption];
    const winners = [];
    
    if (winningOptionData.bets.length > 0) {
      const prizePool = roulette.totalAmount * 0.9; // 90% do pool vai para os vencedores, 10% fica para a casa
      const totalWinningBets = winningOptionData.totalAmount;
      
      for (const bet of winningOptionData.bets) {
        const winnerShare = (bet.amount / totalWinningBets) * prizePool;
        const prize = Math.floor(winnerShare);
        
        // Creditar prêmio ao usuário
        await db.collection('users').updateOne(
          { id: bet.userId },
          { $inc: { diamonds: prize } }
        );
        
        winners.push({
          userId: bet.userId,
          betAmount: bet.amount,
          prize
        });
      }
    }

    // Atualizar roleta como finalizada
    await db.collection('roulettes').updateOne(
      { id: rouletteId },
      { 
        $set: { 
          status: 'finished',
          winner: winningOption,
          winners,
          finished_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    // Buscar roleta finalizada
    const finishedRoulette = await db.collection('roulettes').findOne({ id: rouletteId });

    // Emitir resultado via WebSocket
    io.to(`stream-${roulette.streamId}`).emit('roulette-finished', { 
      roulette: finishedRoulette,
      winningOption,
      winners
    });

    res.json({ success: true, roulette: finishedRoulette, winningOption, winners });
  } catch (error) {
    console.error('Erro ao finalizar roleta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para buscar roletas ativas de uma stream
app.get('/api/streams/:streamId/roulettes/active', async (req, res) => {
  try {
    const streamId = parseInt(req.params.streamId);
    
    const roulettes = await db.collection('roulettes')
      .find({ 
        streamId,
        status: 'active',
        ends_at: { $gt: new Date() }
      })
      .sort({ created_at: -1 })
      .toArray();

    res.json({ roulettes });
  } catch (error) {
    console.error('Erro ao buscar roletas ativas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para buscar histórico de roletas de uma stream
app.get('/api/streams/:streamId/roulettes/history', async (req, res) => {
  try {
    const streamId = parseInt(req.params.streamId);
    const { limit = 20, offset = 0 } = req.query;
    
    const roulettes = await db.collection('roulettes')
      .find({ 
        streamId,
        status: { $in: ['finished', 'cancelled'] }
      })
      .sort({ created_at: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .toArray();

    res.json({ roulettes });
  } catch (error) {
    console.error('Erro ao buscar histórico de roletas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API para cancelar uma roleta (apenas o host pode cancelar)
app.post('/api/roulette/:rouletteId/cancel', async (req, res) => {
  try {
    const rouletteId = parseInt(req.params.rouletteId);
    const { hostUserId } = req.body;
    
    if (!hostUserId) {
      return res.status(400).json({ error: 'hostUserId é obrigatório' });
    }

    const roulette = await db.collection('roulettes').findOne({ id: rouletteId });
    if (!roulette) {
      return res.status(404).json({ error: 'Roleta não encontrada' });
    }

    if (roulette.hostUserId !== hostUserId) {
      return res.status(403).json({ error: 'Apenas o host pode cancelar a roleta' });
    }

    if (roulette.status !== 'active') {
      return res.status(400).json({ error: 'Esta roleta já foi finalizada ou cancelada' });
    }

    // Reembolsar todas as apostas
    for (const option of roulette.options) {
      for (const bet of option.bets) {
        await db.collection('users').updateOne(
          { id: bet.userId },
          { $inc: { diamonds: bet.amount } }
        );
      }
    }

    // Marcar roleta como cancelada
    await db.collection('roulettes').updateOne(
      { id: rouletteId },
      { $set: { status: 'cancelled', updated_at: new Date() } }
    );

    // Emitir cancelamento via WebSocket
    io.to(`stream-${roulette.streamId}`).emit('roulette-cancelled', { rouletteId });

    res.json({ success: true, message: 'Roleta cancelada e apostas reembolsadas' });
  } catch (error) {
    console.error('Erro ao cancelar roleta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para verificar e finalizar roletas expiradas automaticamente
setInterval(async () => {
  try {
    if (!db) return;
    
    const expiredRoulettes = await db.collection('roulettes')
      .find({ 
        status: 'active',
        ends_at: { $lt: new Date() }
      })
      .toArray();

    for (const roulette of expiredRoulettes) {
      // Finalizar automaticamente
      const response = await fetch(`http://localhost:${PORT}/api/roulette/${roulette.id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log(`Roleta ${roulette.id} finalizada automaticamente`);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar roletas expiradas:', error);
  }
}, 5000); // Verificar a cada 5 segundos

console.log('🎰 APIs de Roleta implementadas');


// API para configurações de notificação de presentes
app.get('/api/users/:userId/gift-notification-settings', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Configurações padrão de notificação de presentes
    const settings = {
      enabled: true,
      sound: true,
      popup: true,
      minimumValue: 10,
      showSenderName: true,
      showMessage: true
    };

    res.json({ settings });
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

console.log('🎁 API de configurações de notificação de presentes implementada');

