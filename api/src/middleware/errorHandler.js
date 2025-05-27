import { 
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError
} from '../utils/errorResponse.js';

/**
 * Middleware para tratamento centralizado de erros
 * @param {Error} err - Objeto de erro
 * @param {import('express').Request} req - Objeto de requisição
 * @param {import('express').Response} res - Objeto de resposta
 * @param {import('express').NextFunction} next - Próximo middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro para desenvolvimento
  console.error(`[${new Date().toISOString()}]`, err);

  // Erros do Mongoose
  if (err.name === 'CastError') {
    const message = 'Recurso não encontrado';
    error = new NotFoundError(message);
  }

  // Erros de validação do Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new BadRequestError(message);
  }

  // Erro de chave duplicada
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} já está em uso`;
    error = new ConflictError(message);
  }

  // Erro de JSON inválido
  if (err.type === 'entity.parse.failed') {
    error = new BadRequestError('JSON inválido');
  }

  // Se não for um dos erros tratados acima, definir como erro interno do servidor
  if (!(error instanceof BadRequestError || 
        error instanceof UnauthorizedError || 
        error instanceof ForbiddenError || 
        error instanceof NotFoundError || 
        error instanceof ConflictError || 
        error instanceof ServiceUnavailableError)) {
    error = new InternalServerError('Erro interno do servidor');
  }

  // Enviar resposta de erro
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
