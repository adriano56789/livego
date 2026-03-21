const mongoose = require('mongoose');

// ⚠️ SUBSTITUA PELA STRING DE CONEXÃO DO SEU MONGODB NA VPS
const MONGO_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

// O Schema exato que garante a estrutura correta
const beautySchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['filter', 'effect'] },
  name: { type: String, required: true },
  icon: { type: String, default: null },
  img: { type: String, default: null },
  sort_order: { type: Number, default: 0 }
});

const BeautyModel = mongoose.model('BeautyEffect', beautySchema);

// OS DADOS EXATOS DO MODAL ORIGINAL
const exactData = [
  // ==========================================
  // ABA: RECOMENDAR (Filtros - Usam imagens ou ícones)
  // ==========================================
  { type: 'filter', name: 'Fechar', icon: '🚫', img: null, sort_order: 1 },
  { type: 'filter', name: 'Musa', icon: null, img: 'https://i.pravatar.cc/150?img=1', sort_order: 2 },
  { type: 'filter', name: 'Bonito', icon: null, img: 'https://i.pravatar.cc/150?img=2', sort_order: 3 },
  { type: 'filter', name: 'Vitalidade', icon: null, img: 'https://i.pravatar.cc/150?img=3', sort_order: 4 },
  
  // ==========================================
  // ABA: BELEZA (Efeitos - Usam apenas ícones)
  // ==========================================
  { type: 'effect', name: 'Branquear', icon: '😊', img: null, sort_order: 1 },
  { type: 'effect', name: 'Alisar a pele', icon: '✨', img: null, sort_order: 2 },
  { type: 'effect', name: 'Ruborizar', icon: '☺️', img: null, sort_order: 3 },
  { type: 'effect', name: 'Contraste', icon: '🌗', img: null, sort_order: 4 }
];

async function runSeed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado ao MongoDB na VPS!');

    // Limpa a coleção para evitar duplicatas ou dados errados anteriores
    await BeautyModel.deleteMany({});
    console.log('🧹 Coleção antiga limpa.');

    // Insere os dados corretos
    await BeautyModel.insertMany(exactData);
    console.log('🚀 Dados inseridos com sucesso! O banco está idêntico ao original.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular o banco:', error);
    process.exit(1);
  }
}

runSeed();
