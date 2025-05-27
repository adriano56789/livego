export class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Captura o stack trace para melhor depuração
    Error.captureStackTrace(this, this.constructor);
  }
}

// Erros 4xx
export class BadRequestError extends ErrorResponse {
  constructor(message = 'Requisição inválida') {
    super(message, 400);
  }
}

export class UnauthorizedError extends ErrorResponse {
  constructor(message = 'Não autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends ErrorResponse {
  constructor(message = 'Acesso negado') {
    super(message, 403);
  }
}

export class NotFoundError extends ErrorResponse {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends ErrorResponse {
  constructor(message = 'Conflito') {
    super(message, 409);
  }
}

// Erros 5xx
export class InternalServerError extends ErrorResponse {
  constructor(message = 'Erro interno do servidor') {
    super(message, 500);
  }
}

export class ServiceUnavailableError extends ErrorResponse {
  constructor(message = 'Serviço indisponível') {
    super(message, 503);
  }
}

// Exportações padrão para compatibilidade com CommonJS
const ErrorResponseExport = ErrorResponse;

export default {
  ErrorResponse,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError,
};

export { ErrorResponseExport as ErrorResponse };
