const mongoose = require('mongoose');
require('dotenv').config();

// Definir o schema diretamente no script
const BeautyEffectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['filter', 'effect']
  },
  icon: {
    type: String,
    required: false
  },
  img: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

const BeautyEffect = mongoose.model('BeautyEffect', BeautyEffectSchema);

async function seedBeautyEffects() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin');
    console.log('Conectado ao MongoDB');

    // Limpar dados existentes (opcional)
    await BeautyEffect.deleteMany({});
    console.log('Dados existentes removidos');

    // Dados iniciais - Filters (presets)
    const filters = [
      { name: 'Musa', type: 'filter', icon: '✨' },
      { name: 'Branquear', type: 'filter', icon: '🌟' },
      { name: 'Saudável', type: 'filter', icon: '💫' },
      { name: 'Doce', type: 'filter', icon: '🍯' },
      { name: 'Fresca', type: 'filter', icon: '🌸' }
    ];

    // Dados iniciais - Effects (controles)
    const effects = [
      { name: 'Bigode', type: 'effect', icon: '👨' },
      { name: 'Barba', type: 'effect', icon: '🧔' },
      { name: 'Sobrancelha', type: 'effect', icon: '👁️' },
      { name: 'Blush', type: 'effect', icon: '🌹' },
      { name: 'Lentes', type: 'effect', icon: '👓' }
    ];

    // Inserir todos os dados
    const allEffects = [...filters, ...effects];
    const insertedEffects = await BeautyEffect.insertMany(allEffects);

    console.log(`Inseridos ${insertedEffects.length} efeitos de beleza:`);
    console.log(`- ${filters.length} filters`);
    console.log(`- ${effects.length} effects`);

    // Mostrar dados inseridos
    const allData = await BeautyEffect.find({}).sort({ type: 1, name: 1 });
    console.log('\nDados inseridos:');
    allData.forEach(effect => {
      console.log(`[${effect.type.toUpperCase()}] ${effect.name} ${effect.icon || ''}`);
    });

  } catch (error) {
    console.error('Erro ao inserir dados:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado do MongoDB');
  }
}

// Executar o script
seedBeautyEffects();
