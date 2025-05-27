import User from '../models/User.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errorResponse.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { sendEmail } from '../utils/email.js';

// Helper para formatar a resposta do usuário
const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  social: user.social,
  role: user.role,
  status: user.status,
  isLive: user.isLive,
  streamKey: user.streamKey,
  streamTitle: user.streamTitle,
  streamDescription: user.streamDescription,
  followersCount: user.followers?.length || 0,
  followingCount: user.following?.length || 0,
  isFollowing: false, // Será definido pelo middleware quando necessário
  isBlocked: false,   // Será definido pelo middleware quando necessário
  isBlockedBy: false, // Será definido pelo middleware quando necessário
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * @desc    Obter perfil de um usuário
 * @route   GET /api/users/:id
 * @access  Público
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -failedLoginAttempts -lockUntil -resetPasswordToken -resetPasswordExpire')
      .populate('followers', 'username avatar isLive')
      .populate('following', 'username avatar isLive');

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Verificar se o usuário autenticado está seguindo este perfil
    let isFollowing = false;
    let isBlocked = false;
    let isBlockedBy = false;
    
    if (req.user) {
      isFollowing = user.followers.some(
        follower => follower._id.toString() === req.user.id
      );
      
      // Verificar se o usuário autenticado bloqueou este perfil
      const currentUser = await User.findById(req.user.id);
      isBlocked = currentUser.blockedUsers.some(
        id => id.toString() === user._id.toString()
      );
      
      // Verificar se este perfil bloqueou o usuário autenticado
      isBlockedBy = user.blockedUsers.some(
        id => id.toString() === req.user.id
      );
    }

    const userResponse = {
      ...formatUserResponse(user),
      isFollowing,
      isBlocked,
      isBlockedBy,
      followers: user.followers.map(follower => ({
        id: follower._id,
        username: follower.username,
        avatar: follower.avatar,
        isLive: follower.isLive || false
      })),
      following: user.following.map(followed => ({
        id: followed._id,
        username: followed.username,
        avatar: followed.avatar,
        isLive: followed.isLive || false
      }))
    };

    res.status(200).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Atualizar perfil do usuário
 * @route   PUT /api/users/me
 * @access  Privado
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    const { 
      username, 
      email, 
      password, 
      bio, 
      streamTitle, 
      streamDescription,
      social,
      preferences
    } = req.body;

    // Verificar se o usuário existe
    let user = await User.findById(req.user.id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Atualizar campos permitidos
    const allowedUpdates = [
      'username', 'email', 'bio', 'streamTitle', 'streamDescription', 'social', 'preferences'
    ];
    
    Object.keys(req.body).forEach(update => {
      if (allowedUpdates.includes(update)) {
        updates[update] = req.body[update];
      }
    });

    // Verificar se o email já está em uso
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new BadRequestError('Este email já está em uso');
      }
      
      // Se o email foi alterado, marcar como não verificado
      updates.emailVerified = false;
      
      // Enviar email de verificação
      const emailVerificationToken = user.getEmailVerificationToken();
      await user.save({ validateBeforeSave: false });
      
      await sendEmail({
        email: email,
        subject: 'Verifique seu novo endereço de email',
        template: 'verify-email',
        data: {
          name: username || user.username,
          verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`
        }
      });
    }

    // Atualizar o usuário
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -failedLoginAttempts -lockUntil -resetPasswordToken -resetPasswordExpire');

    res.status(200).json({
      success: true,
      data: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Atualizar senha do usuário
 * @route   PUT /api/users/me/password
 * @access  Privado
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Por favor, forneça a senha atual e a nova senha');
    }

    // Encontrar o usuário e incluir a senha
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Verificar se a senha atual está correta
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Senha atual incorreta');
    }

    // Atualizar a senha
    user.password = newPassword;
    await user.save();

    // Enviar email de confirmação
    await sendEmail({
      email: user.email,
      subject: 'Senha alterada com sucesso',
      template: 'password-changed',
      data: {
        name: user.username,
        ipAddress: req.ip,
        date: new Date().toLocaleString()
      }
    });

    // Gerar novo token JWT
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Atualizar avatar do usuário
 * @route   PUT /api/users/me/avatar
 * @access  Privado
 */
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('Por favor, envie um arquivo de imagem');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Se já existir um avatar, remover o antigo do Cloudinary
    if (user.avatar && user.avatar.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    // Fazer upload da nova imagem para o Cloudinary
    const result = await uploadToCloudinary(req.file.path, {
      folder: `${process.env.CLOUDINARY_FOLDER || 'livego'}/avatars`,
      width: 500,
      height: 500,
      crop: 'fill'
    });

    // Atualizar o avatar do usuário
    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url
    };

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        avatar: user.avatar.url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Seguir/Deixar de seguir um usuário
 * @route   POST /api/users/:id/follow
 * @access  Privado
 */
export const toggleFollow = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      throw new BadRequestError('Você não pode seguir a si mesmo');
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Verificar se o usuário já está seguindo
    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      // Deixar de seguir
      await User.findByIdAndUpdate(
        req.user.id,
        { $pull: { following: userToFollow._id } },
        { new: true }
      );

      await User.findByIdAndUpdate(
        userToFollow._id,
        { $pull: { followers: req.user.id } },
        { new: true }
      );
    } else {
      // Seguir
      await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { following: userToFollow._id } },
        { new: true }
      );

      await User.findByIdAndUpdate(
        userToFollow._id,
        { $addToSet: { followers: req.user.id } },
        { new: true }
      );

      // Aqui você pode adicionar notificação para o usuário seguido
      // await createNotification({
      //   user: userToFollow._id,
      //   type: 'follow',
      //   message: `${currentUser.username} começou a te seguir`,
      //   link: `/profile/${currentUser.username}`,
      //   fromUser: currentUser._id
      // });
    }

    // Obter contagens atualizadas
    const updatedCurrentUser = await User.findById(req.user.id);
    const updatedUserToFollow = await User.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        isFollowing: !isFollowing,
        followersCount: updatedUserToFollow.followers.length,
        followingCount: updatedCurrentUser.following.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bloquear/Desbloquear um usuário
 * @route   POST /api/users/:id/block
 * @access  Privado
 */
export const toggleBlock = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      throw new BadRequestError('Você não pode se bloquear');
    }

    const userToBlock = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToBlock || !currentUser) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Verificar se o usuário já está bloqueado
    const isBlocked = currentUser.blockedUsers.includes(userToBlock._id);
    let message = '';

    if (isBlocked) {
      // Desbloquear usuário
      currentUser.blockedUsers.pull(userToBlock._id);
      message = 'Usuário desbloqueado com sucesso';
    } else {
      // Bloquear usuário
      currentUser.blockedUsers.push(userToBlock._id);
      
      // Remover de seguidores/seguindo
      currentUser.followers.pull(userToBlock._id);
      currentUser.following.pull(userToBlock._id);
      
      // Remover o usuário atual dos seguidores/seguindo do usuário bloqueado
      await User.findByIdAndUpdate(
        userToBlock._id,
        {
          $pull: {
            followers: currentUser._id,
            following: currentUser._id
          }
        }
      );
      
      message = 'Usuário bloqueado com sucesso';
    }

    await currentUser.save();

    res.status(200).json({
      success: true,
      data: {
        isBlocked: !isBlocked,
        message
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obter usuários que o usuário atual segue (seguindo)
 * @route   GET /api/users/me/following
 * @access  Privado
 */
export const getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('following')
      .populate({
        path: 'following',
        select: 'username avatar isLive streamTitle',
        options: {
          sort: { isLive: -1, username: 1 } // Ordena por transmissão ao vivo primeiro, depois por nome de usuário
        }
      });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    res.status(200).json({
      success: true,
      count: user.following.length,
      data: user.following
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obter seguidores do usuário
 * @route   GET /api/users/me/followers
 * @access  Privado
 */
export const getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('followers')
      .populate({
        path: 'followers',
        select: 'username avatar isLive',
        options: {
          sort: { isLive: -1, username: 1 }
        }
      });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    res.status(200).json({
      success: true,
      count: user.followers.length,
      data: user.followers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Pesquisar usuários
 * @route   GET /api/users/search
 * @access  Público
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const query = {
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ],
      status: 'active' // Apenas usuários ativos
    };

    // Se o usuário estiver autenticado, não incluir usuários bloqueados
    if (req.user) {
      const currentUser = await User.findById(req.user.id);
      if (currentUser && currentUser.blockedUsers && currentUser.blockedUsers.length > 0) {
        query._id = { $nin: currentUser.blockedUsers };
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: 'username avatar isLive streamTitle',
      sort: { isLive: -1, username: 1 },
      collation: { locale: 'pt' } // Para ordenação correta de caracteres acentuados
    };

    const users = await User.paginate(query, options);

    // Adicionar informação de se o usuário está seguindo cada resultado
    let results = users.docs;
    
    if (req.user) {
      const currentUser = await User.findById(req.user.id).select('following');
      if (currentUser) {
        results = results.map(user => ({
          ...user.toObject(),
          isFollowing: currentUser.following.some(
            id => id.toString() === user._id.toString()
          )
        }));
      }
    }

    res.status(200).json({
      success: true,
      count: users.totalDocs,
      totalPages: users.totalPages,
      currentPage: users.page,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obter transmissões ao vivo dos usuários que o usuário segue
 * @route   GET /api/users/me/following/live
 * @access  Privado
 */
export const getLiveFollowedStreams = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('following');
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Encontrar usuários seguidos que estão ao vivo
    const liveStreams = await User.find({
      _id: { $in: user.following },
      isLive: true,
      status: 'active'
    })
    .select('username avatar streamTitle streamDescription viewerCount')
    .sort({ viewerCount: -1 });

    res.status(200).json({
      success: true,
      count: liveStreams.length,
      data: liveStreams
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verificar nome de usuário disponível
 * @route   GET /api/users/check-username/:username
 * @access  Público
 */
export const checkUsernameAvailability = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    if (!username || username.trim() === '') {
      throw new BadRequestError('Nome de usuário não pode estar vazio');
    }

    // Verificar se o nome de usuário já está em uso
    const existingUser = await User.findOne({ 
      username: new RegExp(`^${username}$`, 'i') 
    });

    res.status(200).json({
      success: true,
      data: {
        available: !existingUser,
        username
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Excluir conta do usuário
 * @route   DELETE /api/users/me
 * @access  Privado
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      throw new BadRequestError('Por favor, forneça sua senha para confirmar a exclusão da conta');
    }

    // Encontrar o usuário e verificar a senha
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Senha incorreta');
    }

    // Aqui você pode adicionar lógica adicional antes de excluir a conta,
    // como remover arquivos do armazenamento, cancelar assinaturas, etc.
    
    // Soft delete (marcar como excluído)
    user.status = 'inactive';
    user.deletedAt = Date.now();
    await user.save();

    // Opção para exclusão permanente (descomente se necessário):
    // await User.findByIdAndDelete(req.user.id);

    // Invalida o token JWT
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Sua conta foi excluída com sucesso. Sentiremos sua falta!'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Gerar uma nova chave de stream
 * @route   POST /api/users/me/regenerate-stream-key
 * @access  Privado
 */
export const regenerateStreamKey = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Gerar uma nova chave de stream
    user.streamKey = user.generateStreamKey();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        streamKey: user.streamKey
      },
      message: 'Chave de stream regenerada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Gerar uma nova chave de stream
 * @route   POST /api/users/me/regenerate-stream-key
 * @access  Privado
 */
export const regenerateStreamKey = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }
    
    // Gerar nova chave de stream
    const newStreamKey = user.generateStreamKey();
    user.streamKey = newStreamKey;
    
    await user.save({ validateBeforeSave: false });
    
    // Enviar email de notificação
    try {
      await sendEmail({
        email: user.email,
        subject: 'Sua chave de stream foi atualizada',
        template: 'stream-key-updated',
        data: {
          name: user.username,
          streamKey: newStreamKey,
          date: new Date().toLocaleString(),
          ipAddress: req.ip
        }
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de notificação:', emailError);
      // Não falhar a requisição se o email não for enviado
    }
    
    res.status(200).json({
      success: true,
      data: {
        streamKey: newStreamKey
      },
      message: 'Chave de stream atualizada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
