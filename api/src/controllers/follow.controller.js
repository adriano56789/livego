const Follow = require('../models/Follow');
const User = require('../models/User');

// @desc    Seguir um usuário
// @route   POST /api/follow/:userId
// @access  Privado
exports.followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário está tentando se seguir
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode seguir a si mesmo',
      });
    }

    // Verificar se o usuário alvo existe
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Verificar se já está seguindo
    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: userId,
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'Você já está seguindo este usuário',
      });
    }

    // Criar o relacionamento de seguir
    const follow = new Follow({
      follower: req.user.id,
      following: userId,
    });

    await follow.save();

    // Popular os dados do usuário seguido para a resposta
    await follow.populate('following', 'username');

    res.status(201).json({
      success: true,
      message: 'Agora você está seguindo este usuário',
      follow: {
        id: follow._id,
        following: follow.following,
        createdAt: follow.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deixar de seguir um usuário
// @route   DELETE /api/follow/:userId
// @access  Privado
exports.unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verificar se o relacionamento de seguir existe
    const follow = await Follow.findOneAndDelete({
      follower: req.user.id,
      following: userId,
    });

    if (!follow) {
      return res.status(400).json({
        success: false,
        message: 'Você não está seguindo este usuário',
      });
    }

    res.json({
      success: true,
      message: 'Você deixou de seguir este usuário',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verificar se o usuário logado segue outro usuário
// @route   GET /api/follow/check/:userId
// @access  Privado
exports.checkIfFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const follow = await Follow.findOne({
      follower: req.user.id,
      following: userId,
    });

    res.json({
      success: true,
      isFollowing: !!follow,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter lista de seguidores de um usuário
// @route   GET /api/user/:userId/followers
// @access  Público
exports.getUserFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }
    
    // Obter a lista de seguidores com informações básicas
    const followers = await Follow.find({ following: userId })
      .populate('follower', 'username')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: followers.length,
      followers: followers.map(f => ({
        id: f.follower._id,
        username: f.follower.username,
        followedAt: f.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter lista de usuários que um usuário está seguindo
// @route   GET /api/user/:userId/following
// @access  Público
exports.getUserFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }
    
    // Obter a lista de usuários seguidos com informações básicas
    const following = await Follow.find({ follower: userId })
      .populate('following', 'username')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: following.length,
      following: following.map(f => ({
        id: f.following._id,
        username: f.following.username,
        followedAt: f.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};
