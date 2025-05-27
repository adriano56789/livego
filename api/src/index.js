import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import { colors } from './config/colors.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import followRoutes from './routes/follow.js';
import streamRoutes from './routes/stream.js';
import srsRoutes from './routes/srs.js';
import swaggerUi from 'swagger-ui-express';
import { createRequire } from 'module';
import swaggerSpec from './config/swagger.js';

const app = express();

// Conectar ao banco de dados
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Log de requisições
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`.cyan);
    next();
  });
}

// Documentação da API
app.use('/api-docs', 
  swaggerUi.serve, 
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LiveGo API Documentation',
  })
);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/srs', srsRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`${colors.cyan}=== Servidor rodando em ${process.env.NODE_ENV} na porta ${PORT} ===${colors.reset}`);
  console.log(`\nAcesse: http://localhost:${PORT}/api/health\n`.cyan.underline);
});

// Tratamento de erros não tratados
process.on('unhandledRejection', (err, promise) => {
  console.log(`${colors.red}Erro: ${err.message}${colors.reset}`);
  // Fechar o servidor e encerrar o processo
  server.close(() => process.exit(1));
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(`${err.name}: ${err.message}`.red);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
});

// Rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
});

// Exportar o app para testes
export default app;
