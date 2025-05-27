const Stream = require('../models/Stream');
const User = require('../models/User');

// @desc    Obter streams ativos
// @route   GET /api/streams/active
// @access  Público
exports.getActiveStreams = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      category,
      search
    };
    
    // Buscar streams ativos com paginação
    const streams = await Stream.findActiveStreams(options);
    
    // Contar total de streams ativos para paginação
    const count = await Stream.countDocuments({ is_live: true });
    
    res.json({
      success: true,
      count: streams.length,
      total: count,
      data: streams
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter streams de usuários seguidos
// @route   GET /api/streams/following
// @access  Privado
exports.getFollowedStreams = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('following');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }
    
    // Obter IDs dos usuários seguidos
    const followingIds = user.following.map(user => user._id);
    
    // Buscar streams ativos dos usuários seguidos
    const streams = await Stream.find({
      user: { $in: followingIds },
      is_live: true
    })
    .populate('user', 'username avatar')
    .sort({ viewer_count: -1 });
    
    res.json({
      success: true,
      count: streams.length,
      data: streams
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter stream por ID
// @route   GET /api/streams/:id
// @access  Público
exports.getStreamById = async (req, res, next) => {
  try {
    const stream = await Stream.findById(req.params.id)
      .populate('user', 'username avatar');
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream não encontrado',
      });
    }
    
    res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter stream por nome de usuário
// @route   GET /api/streams/user/:username
// @access  Público
exports.getStreamByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }
    
    const stream = await Stream.findOne({
      user: user._id,
      is_live: true
    })
    .populate('user', 'username avatar');
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum stream ativo encontrado para este usuário',
      });
    }
    
    res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar informações do stream
// @route   PUT /api/streams/:id
// @access  Privado (apenas o dono do stream)
exports.updateStream = async (req, res, next) => {
  try {
    const { title, description, category, tags, is_mature, chat_enabled } = req.body;
    
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream não encontrado',
      });
    }
    
    // Verificar se o usuário é o dono do stream
    if (stream.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a atualizar este stream',
      });
    }
    
    // Atualizar campos permitidos
    if (title) stream.title = title;
    if (description !== undefined) stream.description = description;
    if (category) stream.category = category;
    if (tags !== undefined) stream.tags = tags;
    if (is_mature !== undefined) stream.is_mature = is_mature;
    if (chat_enabled !== undefined) stream.chat_enabled = chat_enabled;
    
    await stream.save();
    
    res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Incrementar contador de visualizações
// @route   POST /api/streams/:id/view
// @access  Público
exports.incrementViewCount = async (req, res, next) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream não encontrado',
      });
    }
    
    const viewerCount = await stream.incrementViewerCount();
    
    res.json({
      success: true,
      viewer_count: viewerCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Decrementar contador de visualizações
// @route   DELETE /api/streams/:id/view
// @access  Público
exports.decrementViewCount = async (req, res, next) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream não encontrado',
      });
    }
    
    const viewerCount = await stream.decrementViewerCount();
    
    res.json({
      success: true,
      viewer_count: viewerCount
    });
  } catch (error) {
    next(error);
  }
};
