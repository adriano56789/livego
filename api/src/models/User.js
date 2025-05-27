import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Enums para status e funções do usuário
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

export const USER_ROLES = {
  USER: 'user',
  STREAMER: 'streamer',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

const userSchema = new mongoose.Schema({
  // Identificação
  username: {
    type: String,
    required: [true, 'Por favor, adicione um nome de usuário'],
    unique: true,
    trim: true,
    minlength: [3, 'O nome de usuário deve ter pelo menos 3 caracteres'],
    maxlength: [30, 'O nome de usuário não pode ter mais de 30 caracteres'],
    match: [/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underscores']
  },
  
  // Autenticação
  email: {
    type: String,
    required: [true, 'Por favor, adicione um email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor, use um email válido']
  },
  password: {
    type: String,
    required: [true, 'Por favor, adicione uma senha'],
    minlength: [8, 'A senha deve ter pelo menos 8 caracteres'],
    select: false
  },
  
  // Status e permissões
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.USER
  },
  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.ACTIVE
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // Stream
  streamKey: {
    type: String,
    unique: true,
    sparse: true
  },
  streamTitle: {
    type: String,
    maxlength: [100, 'O título da transmissão não pode ter mais de 100 caracteres'],
    default: 'Transmissão ao vivo'
  },
  streamDescription: {
    type: String,
    maxlength: [500, 'A descrição não pode ter mais de 500 caracteres']
  },
  isLive: {
    type: Boolean,
    default: false
  },
  lastStream: {
    type: Date
  },
  
  // Perfil
  avatar: {
    type: String,
    default: 'default-avatar.jpg'
  },
  bio: {
    type: String,
    maxlength: [500, 'A biografia não pode ter mais de 500 caracteres']
  },
  social: {
    youtube: String,
    twitter: String,
    facebook: String,
    instagram: String,
    twitch: String,
    tiktok: String
  },
  
  // Seguidores/Seguindo
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Segurança
  failedLoginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    select: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpire: {
    type: Date,
    select: false
  },
  
  // Metadados
  lastLogin: {
    type: Date
  },
  lastIp: {
    type: String,
    select: false
  },
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      newsletter: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showEmail: {
        type: Boolean,
        default: false
      },
      showLastSeen: {
        type: Boolean,
        default: true
      },
      showOnlineStatus: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  
  // Auditoria
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    select: false
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware para atualizar o timestamp de atualização
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  // Só executa se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Atualizar lastLogin após login bem-sucedido
userSchema.methods.updateLoginInfo = async function(ip, userAgent) {
  this.lastLogin = Date.now();
  this.lastIp = ip;
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  
  // Adicionar ao histórico de login (mantém apenas os 5 mais recentes)
  this.loginHistory.unshift({ ip, userAgent });
  if (this.loginHistory.length > 5) {
    this.loginHistory = this.loginHistory.slice(0, 5);
  }
  
  await this.save({ validateBeforeSave: false });
};

// Método para comparar senhas
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Gerar stream_key único
userSchema.methods.generateStreamKey = function() {
  this.streamKey = `stream_${crypto.randomBytes(16).toString('hex')}`;
  return this.streamKey;
};

// Gerar token de redefinição de senha
userSchema.methods.getResetPasswordToken = function() {
  // Gerar token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash do token e definir no resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Definir expiração (10 minutos)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Gerar token de verificação de email
userSchema.methods.getEmailVerificationToken = function() {
  // Gerar token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash do token e definir no emailVerificationToken
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Definir expiração (24 horas)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

// Verificar se a conta está bloqueada
userSchema.virtual('isLocked').get(function() {
  return this.lockUntil && this.lockUntil > Date.now();
});

// Índices para melhorar a performance das consultas
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ streamKey: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'loginHistory.timestamp': -1 });

// Middleware para soft delete
userSchema.pre(/^find/, function(next) {
  // Verifica se a opção withDeleted está ativada
  if (this.getOptions().withDeleted) {
    return next();
  }
  
  // Filtra apenas usuários não deletados
  this.find({ deletedAt: { $eq: null } });
  next();
});

// Método para soft delete
userSchema.methods.softDelete = async function() {
  this.deletedAt = Date.now();
  await this.save();
};

// Método para restaurar usuário
userSchema.methods.restore = async function() {
  this.deletedAt = undefined;
  await this.save();
};

// Método estático para buscar por credenciais
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password +status +failedLoginAttempts +lockUntil');
  
  if (!user) {
    throw new Error('Credenciais inválidas');
  }
  
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    user.failedLoginAttempts += 1;
    
    // Bloquear após 5 tentativas falhas
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutos
    }
    
    await user.save({ validateBeforeSave: false });
    throw new Error('Credenciais inválidas');
  }
  
  // Resetar contador de tentativas falhas
  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }
  
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
