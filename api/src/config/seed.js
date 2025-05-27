import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Stream from '../models/Stream.js';
import Follow from '../models/Follow.js';
import { 
  BadRequestError, 
  InternalServerError 
} from '../utils/errorResponse.js';

// Função para criar índices
const createIndexes = async () => {
  try {
    // Índices para o modelo User
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ stream_key: 1 }, { unique: true, sparse: true });
    
    // Índices para o modelo Stream
    await Stream.collection.createIndex({ user: 1, is_live: -1 });
    await Stream.collection.createIndex({ is_live: -1, viewer_count: -1 });
    await Stream.collection.createIndex({ category: 1, is_live: -1 });
    await Stream.collection.createIndex({ stream_key: 1 }, { unique: true });
    
    // Índices para o modelo Follow
    await Follow.collection.createIndex(
      { follower: 1, following: 1 }, 
      { unique: true }
    );
    await Follow.collection.createIndex({ follower: 1 });
    await Follow.collection.createIndex({ following: 1 });
    
    console.log('Índices criados com sucesso'.green);
  } catch (error) {
    console.error('Erro ao criar índices:'.red, error);
    throw new InternalServerError('Falha ao criar índices no banco de dados');
  }
};

// Função para criar um usuário administrador padrão
const createDefaultAdmin = async () => {
  try {
    // Verificar se já existe um administrador
    const adminExists = await User.findOne({ email: 'admin@livego.com' });
    
    if (adminExists) {
      console.log('Usuário administrador padrão já existe'.yellow);
      return;
    }
    
    // Criar o usuário administrador
    const admin = new User({
      username: 'admin',
      email: 'admin@livego.com',
      password: 'admin123', // Senha deve ser alterada no primeiro login
      role: 'admin',
    });
    
    // Gerar chave de stream para o administrador
    admin.generateStreamKey();
    
    // Salvar o administrador no banco de dados
    await admin.save();
    
    console.log('Usuário administrador padrão criado com sucesso'.green);
    console.log('Email: admin@livego.com'.cyan);
    console.log('Senha: admin123'.cyan);
    console.log('\nPor favor, altere a senha no primeiro login!\n'.yellow);
  } catch (error) {
    console.error('Erro ao criar usuário administrador padrão:'.red, error);
    throw new InternalServerError('Falha ao criar usuário administrador padrão');
  }
};

// Função principal para inicialização
const seedDatabase = async () => {
  try {
    console.log('Iniciando a inicialização do banco de dados...'.cyan);
    
    // Criar índices
    await createIndexes();
    
    // Criar usuário administrador padrão (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await createDefaultAdmin();
    }
    
    console.log('Inicialização do banco de dados concluída com sucesso!'.green.bold);
  } catch (error) {
    console.error('Erro durante a inicialização do banco de dados:'.red, error);
    process.exit(1);
  }
};

// Executar a inicialização se este arquivo for executado diretamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
  import('dotenv/config');
  
  // Conectar ao banco de dados
  import('./database.js').then(async ({ default: connectDB }) => {
    try {
      await connectDB();
      await seedDatabase();
      process.exit(0);
    } catch (error) {
      console.error('Erro durante a execução do seed:', error);
      process.exit(1);
    }
  });
}

export default seedDatabase;
