import mongoose from 'mongoose';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Importar o modelo User
const UserSchema = new mongoose.Schema({
  receptores: { type: Number, default: 0 },
  enviados: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  name: String,
  email: String,
  identification: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin')
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar:', err));

// Script para zerar contadores do usuário
async function resetUserCounters() {
  try {
    // Primeiro, listar todos os usuários para encontrar o seu
    const allUsers = await User.find({});
    console.log(`Total de usuários encontrados: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('Nenhum usuário encontrado no banco de dados.');
      return;
    }
    
    console.log('Usuários encontrados:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Nome: ${user.name}, Email: ${user.email || 'N/A'}, ID: ${user.identification || 'N/A'}`);
      console.log(`   Enviados: ${user.enviados || 0}, Receptores: ${user.receptores || 0}, Diamonds: ${user.diamonds || 0}`);
    });

    // Zerar contadores de todos os usuários que têm valores > 0
    const result = await User.updateMany(
      { 
        $or: [
          { enviados: { $gt: 0 } },
          { receptores: { $gt: 0 } }
        ]
      },
      { 
        $set: {
          enviados: 0,
          receptores: 0
        }
      }
    );

    console.log('Resultado:', result);
    
    if (result.matchedCount === 0) {
      console.log('Usuário não encontrado. Verifique o email/username/ID.');
    } else if (result.modifiedCount > 0) {
      console.log('✅ Contadores zerados com sucesso!');
      console.log('Agora envie um presente e verifique se mostra os valores corretos.');
    } else {
      console.log('Usuário encontrado, mas os contadores já estavam zerados.');
    }
    
  } catch (error) {
    console.error('Erro ao zerar contadores:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Executar o script
resetUserCounters();
