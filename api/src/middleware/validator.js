import { validationResult, body, param, query } from 'express-validator';
import { BadRequestError } from '../utils/errorResponse.js';

// Middleware para validar os resultados da validação
export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Extrair mensagens de erro
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

    throw new BadRequestError('Dados de entrada inválidos', {
      errors: extractedErrors
    });
  };
};

// Validações comuns
export const userValidationRules = {
  register: [
    body('username')
      .trim()
      .notEmpty().withMessage('Nome de usuário é obrigatório')
      .isLength({ min: 3 }).withMessage('Nome de usuário deve ter no mínimo 3 caracteres')
      .isLength({ max: 30 }).withMessage('Nome de usuário deve ter no máximo 30 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Nome de usuário pode conter apenas letras, números e underscores'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email é obrigatório')
      .isEmail().withMessage('Por favor, insira um email válido')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Senha é obrigatória')
      .isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres')
      .matches(/[0-9]/).withMessage('A senha deve conter pelo menos um número')
      .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula')
      .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula')
  ],
  
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email é obrigatório')
      .isEmail().withMessage('Por favor, insira um email válido'),
    
    body('password')
      .notEmpty().withMessage('Senha é obrigatória')
  ],
  
  updateProfile: [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3 }).withMessage('Nome de usuário deve ter no mínimo 3 caracteres')
      .isLength({ max: 30 }).withMessage('Nome de usuário deve ter no máximo 30 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Nome de usuário pode conter apenas letras, números e underscores'),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Por favor, insira um email válido')
      .normalizeEmail(),
    
    body('currentPassword')
      .if((value, { req }) => req.body.newPassword)
      .notEmpty().withMessage('A senha atual é necessária para alterar a senha'),
    
    body('newPassword')
      .optional()
      .isLength({ min: 6 }).withMessage('A nova senha deve ter no mínimo 6 caracteres')
      .matches(/[0-9]/).withMessage('A nova senha deve conter pelo menos um número')
      .matches(/[a-z]/).withMessage('A nova senha deve conter pelo menos uma letra minúscula')
      .matches(/[A-Z]/).withMessage('A nova senha deve conter pelo menos uma letra maiúscula')
  ]
};

export const streamValidationRules = {
  createOrUpdate: [
    body('title')
      .trim()
      .notEmpty().withMessage('O título é obrigatório')
      .isLength({ max: 100 }).withMessage('O título deve ter no máximo 100 caracteres'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('A descrição deve ter no máximo 500 caracteres'),
    
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('A categoria deve ter no máximo 50 caracteres'),
    
    body('tags')
      .optional()
      .isArray({ max: 5 }).withMessage('Máximo de 5 tags permitidas'),
    
    body('is_mature')
      .optional()
      .isBoolean().withMessage('O campo is_mature deve ser um valor booleano'),
    
    body('chat_enabled')
      .optional()
      .isBoolean().withMessage('O campo chat_enabled deve ser um valor booleano')
  ]
};

export const idParamValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('ID é obrigatório')
    .isMongoId().withMessage('ID inválido')
];

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('A página deve ser um número inteiro maior que 0')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('O limite deve ser um número entre 1 e 100')
    .toInt()
];

// Exportar tudo como um objeto padrão para compatibilidade
export default {
  validate,
  userValidationRules,
  streamValidationRules,
  idParamValidation,
  paginationValidation
};
