import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LiveGo API',
      version: '1.0.0',
      description: 'API para a plataforma de streaming LiveGo',
      contact: {
        name: 'Suporte LiveGo',
        email: 'suporte@livego.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.livego.com/v1',
        description: 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acesso inválido ou ausente',
        },
        BadRequest: {
          description: 'Requisição inválida',
        },
        NotFound: {
          description: 'Recurso não encontrado',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    `${__dirname}/../routes/*.js`,
    `${__dirname}/../models/*.js`,
  ],
};

const specs = swaggerJsdoc(options);

export default specs;
