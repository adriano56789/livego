import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { 
  UnauthorizedError, 
  ForbiddenError 
} from '../utils/errorResponse.js';

// Tipos de usuário
const USER_ROLES = {
  USER: 'user',
  STREAMER: 'streamer',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

/**
 * Middleware para proteger rotas que requerem autenticação
 * @param {import('express').Request} req - Objeto de requisição
 * @param {import('express').Response} res - Objeto de resposta
 * @param {import('express').NextFunction} next - Próximo middleware
 */
export const protect = async (req, res, next) => {
  let token;

  // Verificar se o token está no cabeçalho de autorização
  // Verificar se o token está no cabeçalho de autorização
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return next(new UnauthorizedError('Nenhum token fornecido'));
  }

  try {
    // Obter o token do cabeçalho
    token = req.headers.authorization.split(' ')[1];

    // Verificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obter o usuário do token
    req.user = await User.findById(decoded.id).select('-password -__v');

    if (!req.user) {
      return next(new UnauthorizedError('Usuário não encontrado'));
    }

    // Verificar se a conta está ativa
    if (req.user.status !== 'active') {
      return next(new ForbiddenError('Esta conta está desativada ou suspensa'));
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Sessão expirada, faça login novamente'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token inválido'));
    }
    return next(new UnauthorizedError('Falha na autenticação'));
  }
};

/**
 * Middleware para verificar se o usuário tem permissão de administrador
 * @param {import('express').Request} req - Objeto de requisição
 * @param {import('express').Response} res - Objeto de resposta
 * @param {import('express').NextFunction} next - Próximo middleware
 */
export const admin = (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Usuário não autenticado'));
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    return next(new ForbiddenError('Acesso restrito a administradores'));
  }

  next();
};

/**
 * Middleware para verificar se o usuário tem uma determinada função
 * @param {...string} roles - Funções permitidas
 * @returns {import('express').RequestHandler} Middleware de verificação de função
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuário não autenticado'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Acesso restrito a: ${roles.join(', ')}`)
      );
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário é o dono do recurso ou admin
 * @param {string} resourceUserId - ID do dono do recurso
 * @returns {import('express').RequestHandler} Middleware de verificação de propriedade
 */
export const checkOwnership = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuário não autenticado'));
    }

    // Se for admin, permite o acesso
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Verifica se o usuário é o dono do recurso
    if (req.user.id !== resourceUserId) {
      return next(new ForbiddenError('Acesso não autorizado a este recurso'));
    }

    next();
  };
};

export { USER_ROLES };
