import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { 
  BadRequestError, 
  UnauthorizedError, 
  InternalServerError 
} from '../utils/errorResponse.js';
import { sendEmail } from '../utils/email.js';

// Tipos de usuário
const USER_ROLES = {
  USER: 'user',
  STREAMER: 'streamer',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

// Gerar token JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Gerar token de redefinição de senha
const generateResetToken = () => {
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos
  
  return { resetToken, resetPasswordToken, resetPasswordExpire };
};

/**
 * @desc    Registrar um novo usuário
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password, role = USER_ROLES.USER } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() }, 
        { username: username.toLowerCase() }
      ] 
    });

    if (existingUser) {
      throw new BadRequestError(
        'Já existe um usuário com este email ou nome de usuário',
        { field: existingUser.email === email ? 'email' : 'username' }
      );
    }

    // Validar função do usuário
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new BadRequestError('Função de usuário inválida');
    }

    // Criar novo usuário
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role,
      streamKey: `stream_${crypto.randomBytes(16).toString('hex')}`,
      status: 'active',
      emailVerified: false
    });

    // Gerar token de verificação de email
    const emailVerificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Enviar email de verificação (implementar função sendEmail)
    try {
      const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${emailVerificationToken}`;
      
      await sendEmail({
        email: user.email,
        subject: 'Verifique seu email - LiveGo',
        template: 'email-verification',
        data: {
          name: user.username,
          verificationUrl
        }
      });
    } catch (error) {
      console.error('Erro ao enviar email de verificação:', error);
      // Não interrompe o registro se o email falhar
    }

    // Gerar token JWT
    const token = generateToken(user._id);

    // Configurar cookie com o token
    const cookieOptions = {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res
      .status(201)
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          streamKey: user.streamKey,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Autenticar usuário e obter token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar email e senha
    if (!email || !password) {
      throw new BadRequestError('Por favor, forneça email e senha');
    }

    // Verificar se o usuário existe e incluir a senha
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +status')
      .select('+failedLoginAttempts +lockUntil');

    // Verificar se a conta está bloqueada
    if (user && user.isLocked) {
      const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      throw new UnauthorizedError(
        `Conta bloqueada por tentativas de login. Tente novamente em ${timeLeft} minutos.`
      );
    }

    // Verificar credenciais
    if (!user || !(await user.matchPassword(password))) {
      // Incrementar tentativas de login
      if (user) {
        user.failedLoginAttempts += 1;
        
        // Bloquear conta após 5 tentativas falhas
        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = Date.now() + 30 * 60 * 1000; // Bloquear por 30 minutos
        }
        
        await user.save({ validateBeforeSave: false });
      }
      
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Resetar contador de tentativas falhas após login bem-sucedido
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save({ validateBeforeSave: false });
    }

    // Verificar se o email foi verificado
    if (!user.emailVerified) {
      // Opcional: reenviar email de verificação
      // Pode ser implementado conforme necessário
    }

    // Verificar se a conta está ativa
    if (user.status !== 'active') {
      throw new UnauthorizedError('Sua conta está inativa. Entre em contato com o suporte.');
    }

    // Gerar token JWT
    const token = generateToken(user._id);

    // Configurar cookie com o token
    const cookieOptions = {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    // Remover campos sensíveis
    user.password = undefined;
    user.failedLoginAttempts = undefined;
    user.lockUntil = undefined;

    res
      .status(200)
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          streamKey: user.streamKey,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obter dados do usuário atual
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -failedLoginAttempts -lockUntil -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
