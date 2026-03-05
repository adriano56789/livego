import mongoose from 'mongoose';
import { Gift } from '../models';

// Todos os presentes do database.ts
const allGifts = [
    // Popular
    { name: 'Coração', price: 1, icon: '❤️', category: 'Popular' }, 
    { name: 'Café', price: 3, icon: '☕', category: 'Popular' },
    { name: 'Milho', price: 2, icon: '🍿', category: 'Popular' }, 
    { name: 'Rosa', price: 5, icon: '🌷', category: 'Popular' },
    { name: 'Flor', price: 7, icon: '🌸', category: 'Popular' },
    { name: 'Donut', price: 8, icon: '🍩', category: 'Popular' }, 
    { name: 'Balão', price: 9, icon: '🎈', category: 'Popular' },
    { name: 'Batom', price: 10, icon: '💄', category: 'Popular' }, 
    { name: 'Chocolate', price: 12, icon: '🍫', category: 'Popular' },
    { name: 'Sorvete', price: 15, icon: '🍦', category: 'Popular' }, 
    { name: 'Lanche', price: 20, icon: '🍔', category: 'Popular' }, 
    { name: 'Perfume', price: 25, icon: '🧴', category: 'Popular' },
    { name: 'Pirulito', price: 30, icon: '🍭', category: 'Popular' }, 
    { name: 'Pizza', price: 35, icon: '🍕', category: 'Popular' },
    { name: 'Microfone', price: 40, icon: '🎤', category: 'Popular' }, 
    { name: 'Alvo', price: 50, icon: '🎯', category: 'Popular' },
    { name: 'Câmera', price: 60, icon: '📸', category: 'Popular' }, 
    { name: 'Óculos de Sol', price: 80, icon: '😎', category: 'Popular' }, 
    { name: 'Panda', price: 65, icon: '🐼', category: 'Popular' },
    { name: 'Coala', price: 68, icon: '🐨', category: 'Popular' },
    { name: 'Fatia de Pizza', price: 10, icon: '🍕', category: 'Popular' },
    { name: 'Taco', price: 15, icon: '🌮', category: 'Popular' },
    { name: 'Biscoito', price: 5, icon: '🍪', category: 'Popular' },
    { name: 'Cupcake', price: 8, icon: '🧁', category: 'Popular' },
    { name: 'Morango', price: 12, icon: '🍓', category: 'Popular' },
    { name: 'Abacate', price: 18, icon: '🥑', category: 'Popular' },
    { name: 'Brócolis', price: 4, icon: '🥦', category: 'Popular' },
    { name: 'Baguete', price: 6, icon: '🥖', category: 'Popular' },
    { name: 'Pretzel', price: 7, icon: '🥨', category: 'Popular' },
    { name: 'Queijo', price: 11, icon: '🧀', category: 'Popular' },
    { name: 'Waffle', price: 14, icon: '🧇', category: 'Popular' },
    { name: 'Panquecas', price: 16, icon: '🥞', category: 'Popular' },
    { name: 'Bacon', price: 19, icon: '🥓', category: 'Popular' },
    { name: 'Cachorro-quente', price: 22, icon: '🌭', category: 'Popular' },
    { name: 'Batata Frita', price: 9, icon: '🍟', category: 'Popular' },
    { name: 'Sanduíche', price: 24, icon: '🥪', category: 'Popular' },
    { name: 'Dango', price: 13, icon: '🍡', category: 'Popular' },
    { name: 'Onigiri', price: 5, icon: '🍙', category: 'Popular' },
    { name: 'Camarão Frito', price: 28, icon: '🍤', category: 'Popular' },
    { name: 'Sushi', price: 33, icon: '🍣', category: 'Popular' },
    { name: 'Taça de Sorvete', price: 17, icon: '🍨', category: 'Popular' },
    { name: 'Torta', price: 21, icon: '🥧', category: 'Popular' },
    { name: 'Doce', price: 3, icon: '🍬', category: 'Popular' },
    { name: 'Mel', price: 26, icon: '🍯', category: 'Popular' },
    { name: 'Copo de Leite', price: 8, icon: '🥛', category: 'Popular' },
    { name: 'Chá Verde', price: 10, icon: '🍵', category: 'Popular' },
    { name: 'Saquê', price: 29, icon: '🍶', category: 'Popular' },
    { name: 'Cerveja', price: 15, icon: '🍺', category: 'Popular' },
    { name: 'Milkshake', price: 22, icon: '🥤', category: 'Popular' },
    { name: 'Croissant', price: 11, icon: '🥐', category: 'Popular' },
    { name: 'Uvas', price: 14, icon: '🍇', category: 'Popular' },
    { name: 'Frango Frito', price: 27, icon: '🍗', category: 'Popular' },
    { name: 'Melancia', price: 10, icon: '🍉', category: 'Popular' },
    
    // Atividade
    { name: 'Bola de Basquete', price: 70, icon: '🏀', category: 'Atividade' },
    { name: 'Bola', price: 75, icon: '⚽', category: 'Atividade' }, 
    { name: 'Túmulo', price: 99, icon: '🪦', category: 'Atividade' }, 
    { name: 'Bicicleta', price: 110, icon: '🚲', category: 'Atividade' }, 
    { name: 'Haltere', price: 120, icon: '💪', category: 'Atividade' }, 
    { name: 'Skate', price: 130, icon: '🛹', category: 'Atividade' }, 
    { name: 'Prancha de Surf', price: 140, icon: '🏄', category: 'Atividade' }, 
    { name: 'Luva de Boxe', price: 160, icon: '🥊', category: 'Atividade' },
    { name: 'Taco de Golfe', price: 180, icon: '🏌️', category: 'Atividade' },
    { name: 'Capacete de Corrida', price: 210, icon: '⛑️', category: 'Atividade' },
    { name: 'Bola de Tênis', price: 85, icon: '🎾', category: 'Atividade' },
    { name: 'Boliche', price: 95, icon: '🎳', category: 'Atividade' },
    { name: 'Bola de Rugby', price: 105, icon: '🏉', category: 'Atividade' },
    { name: 'Voleibol', price: 90, icon: '🏐', category: 'Atividade' },
    { name: 'Beisebol', price: 80, icon: '⚾', category: 'Atividade' },
    { name: 'Pingue-pongue', price: 78, icon: '🏓', category: 'Atividade' },
    { name: 'Badminton', price: 82, icon: '🏸', category: 'Atividade' },
    { name: 'Hóquei no Gelo', price: 150, icon: '🏒', category: 'Atividade' },
    { name: 'Hóquei de Campo', price: 145, icon: '🏑', category: 'Atividade' },
    { name: 'Lacrosse', price: 155, icon: '🥍', category: 'Atividade' },
    { name: 'Críquete', price: 115, icon: '🏏', category: 'Atividade' },
    { name: 'Rede de Gol', price: 190, icon: '🥅', category: 'Atividade' },
    { name: 'Pipa', price: 65, icon: '🪁', category: 'Atividade' },
    { name: 'Frisbee', price: 55, icon: '🥏', category: 'Atividade' },
    { name: 'Trenzinho', price: 220, icon: '🛷', category: 'Atividade' },
    { name: 'Pedra de Curling', price: 230, icon: '🥌', category: 'Atividade' },
    { name: 'Esquis', price: 250, icon: '🎿', category: 'Atividade', triggersAutoFollow: true },
    { name: 'Dardos', price: 45, icon: '🎯', category: 'Atividade' },
    { name: 'Ioiô', price: 35, icon: '🪀', category: 'Atividade' },
    { name: 'Bumerangue', price: 40, icon: '🪃', category: 'Atividade' },
    { name: 'Trenó', price: 170, icon: '🛷', category: 'Atividade' },
    { name: 'Arco e Flecha', price: 190, icon: '🏹', category: 'Atividade' },
    { name: 'Patins', price: 135, icon: '🛼', category: 'Atividade' },
    
    // Luxo
    { name: 'Urso', price: 500, icon: '🧸', category: 'Luxo' }, 
    { name: 'Boia', price: 800, icon: '🍩', category: 'Luxo' }, 
    { name: 'Champanhe', price: 1200, icon: '🍾', category: 'Luxo' }, 
    { name: 'Gema de Nível', price: 1500, icon: '💎', category: 'Luxo' }, 
    { name: 'Relógio', price: 2000, icon: '⌚', category: 'Luxo' }, 
    { name: 'Bolsa', price: 2500, icon: '👜', category: 'Luxo' }, 
    { name: 'Moto', price: 3000, icon: '🛵', category: 'Luxo' }, 
    { name: 'Violino', price: 3500, icon: '🎻', category: 'Luxo' },
    { name: 'Salto Alto', price: 4000, icon: '👠', category: 'Luxo' },
    { name: 'Piano', price: 4500, icon: '🎹', category: 'Luxo' },
    { name: 'Colar', price: 4800, icon: '📿', category: 'Luxo' },
    { name: 'Coroa', price: 5000, icon: '👑', category: 'Luxo', triggersAutoFollow: true }, 
    { name: 'Bolsa de Grife', price: 6000, icon: '👜', category: 'Luxo' },
    { name: 'Diamante Azul', price: 6000, icon: '💠', category: 'Luxo' }, 
    { name: 'Carro Esportivo', price: 8888, icon: '🏎️', category: 'Luxo', triggersAutoFollow: true },
    { name: 'Jóia Rara', price: 12000, icon: '💍', category: 'Luxo', triggersAutoFollow: true },
    { name: 'Barco a Vela', price: 9000, icon: '⛵', category: 'Luxo', triggersAutoFollow: true },
    { name: 'Navio de Cruzeiro', price: 15000, icon: '🛳️', category: 'Luxo' },
    { name: 'Sino', price: 1800, icon: '🔔', category: 'Luxo' },
    { name: 'Trompete', price: 2200, icon: '🎺', category: 'Luxo' },
    { name: 'Saxofone', price: 2800, icon: '🎷', category: 'Luxo' },
    { name: 'Acordeão', price: 3200, icon: '🪗', category: 'Luxo' },
    { name: 'Harpa', price: 4200, icon: '🎻', category: 'Luxo' },
    { name: 'Xadrez', price: 1000, icon: '♟️', category: 'Luxo' },
    { name: 'Jóia', price: 7500, icon: '💎', category: 'Luxo' },
    { name: 'Mala de Dinheiro', price: 10000, icon: '💰', category: 'Luxo' },
    { name: 'Carta de Baralho', price: 900, icon: '🃏', category: 'Luxo' },
    { name: 'Telescópio', price: 5500, icon: '🔭', category: 'Luxo' },
    { name: 'Microscópio', price: 5200, icon: '🔬', category: 'Luxo' },
    { name: 'Ampulheta', price: 1300, icon: '⏳', category: 'Luxo' },
    { name: 'Despertador', price: 1100, icon: '⏰', category: 'Luxo' },
    { name: 'Globo', price: 3800, icon: '🌍', category: 'Luxo' },
    { name: 'Balão de Ar Quente', price: 4600, icon: '🎈', category: 'Luxo' },
    { name: 'Troféu', price: 9999, icon: '🏆', category: 'Luxo' },
    { name: 'Barra de Ouro', price: 7000, icon: '🧈', category: 'Luxo' },
    { name: 'Cofre de Diamantes', price: 11000, icon: '💰', category: 'Luxo' },
    { name: 'Chave do Carro', price: 9500, icon: '🔑', category: 'Luxo' },
    { name: 'Cetro Real', price: 13000, icon: '👑', category: 'Luxo' },
    
    // VIP
    { name: 'Foguete', price: 500, icon: '🚀', category: 'VIP', triggersAutoFollow: true }, 
    { name: 'Jato Privado', price: 600, icon: '✈️', category: 'VIP' }, 
    { name: 'Anel', price: 750, icon: '💍', category: 'VIP' }, 
    { name: 'Leão', price: 800, icon: '🦁', category: 'VIP' }, 
    { name: 'Carro', price: 1000, icon: '🚗', category: 'VIP' }, 
    { name: 'Fênix', price: 1200, icon: '🔥', category: 'VIP' }, 
    { name: 'Supercarro', price: 1500, icon: '🏎️', category: 'VIP' }, 
    { name: 'Dragão', price: 1800, icon: '🐉', category: 'VIP' }, 
    { name: 'Castelo', price: 2000, icon: '🏰', category: 'VIP', triggersAutoFollow: true },
    { name: 'Universo', price: 2500, icon: '🌌', category: 'VIP' }, 
    { name: 'Helicóptero', price: 3000, icon: '🚁', category: 'VIP' }, 
    { name: 'Planeta', price: 4000, icon: '🪐', category: 'VIP' }, 
    { name: 'Iate', price: 5000, icon: '🛥️', category: 'VIP' }, 
    { name: 'Galáxia', price: 6000, icon: '🌠', category: 'VIP' }, 
    { name: 'Coroa Real', price: 8000, icon: '🤴', category: 'VIP' }, 
    { name: 'Diamante VIP', price: 10000, icon: '💎', category: 'VIP' }, 
    { name: 'Ilha Particular', price: 15000, icon: '🏝️', category: 'VIP' }, 
    { name: 'Cavalo Alado', price: 25000, icon: '🦄', category: 'VIP' },
    { name: 'Tigre Dourado', price: 40000, icon: '🐅', category: 'VIP' },
    { name: 'Nave Espacial', price: 75000, icon: '🛸', category: 'VIP' },
    { name: 'Estrela Cadente', price: 22000, icon: '🌠', category: 'VIP' },
    { name: 'Cometa', price: 35000, icon: '☄️', category: 'VIP' },
    { name: 'Buraco Negro', price: 99999, icon: '⚫', category: 'VIP' },
    { name: 'Tesouro', price: 50000, icon: '👑', category: 'VIP' },
    { name: 'Pégaso', price: 60000, icon: '🦄', category: 'VIP' },
    { name: 'Grifo', price: 65000, icon: '🦅', category: 'VIP' },
    { name: 'Kraken', price: 70000, icon: '🐙', category: 'VIP' },
    { name: 'Hidra', price: 80000, icon: '🐉', category: 'VIP' },
    { name: 'Sereia', price: 45000, icon: '🧜‍♀️', category: 'VIP' },
    { name: 'Gênio', price: 55000, icon: '🧞', category: 'VIP' },
    { name: 'Anjo', price: 48000, icon: '👼', category: 'VIP' },
    { name: 'Excalibur', price: 42000, icon: '🗡️', category: 'VIP' },
    { name: 'Martelo de Thor', price: 68000, icon: '🔨', category: 'VIP' },
    { name: 'Tridente de Poseidon', price: 72000, icon: '🔱', category: 'VIP' },
    { name: 'Arco de Artemis', price: 62000, icon: '🏹', category: 'VIP' },
    { name: 'Elmo de Hades', price: 58000, icon: '🎩', category: 'VIP' },
    { name: 'Sandálias de Hermes', price: 52000, icon: '👟', category: 'VIP' },
    { name: 'Velo de Ouro', price: 90000, icon: '🏆', category: 'VIP' },
    { name: 'Maçã Dourada', price: 43000, icon: '🍏', category: 'VIP' },
    { name: 'Caixa de Pandora', price: 85000, icon: '🎁', category: 'VIP' },
    { name: 'Foguete Espacial', price: 25000, icon: '🚀', category: 'VIP' },
    { name: 'Disco Voador', price: 30000, icon: '🛸', category: 'VIP' },
    { name: 'Jet Ski', price: 700, icon: '🚤', category: 'VIP' },
    { name: 'Ilha Flutuante', price: 16000, icon: '🏝️', category: 'VIP' },
    { name: 'Trem Bala', price: 9000, icon: '🚄', category: 'VIP' },
    { name: 'Dirigível', price: 11000, icon: '🎈', category: 'VIP' },
    
    // Efeito
    { name: 'Explosão de Confete', price: 19000, icon: '🎉', category: 'Efeito' }, 
    { name: 'Invocação de Dragão', price: 80000, icon: '🐲', category: 'Efeito' }, 
    { name: 'Coração Gigante', price: 28000, icon: '❤️‍🔥', category: 'Efeito' }, 
    { name: 'Beijo de Anjo', price: 23000, icon: '😘', category: 'Efeito' }, 
    { name: 'Dança dos Robôs', price: 33000, icon: '🤖', category: 'Efeito' }, 
    { name: 'Portal Galáctico', price: 42000, icon: '🌀', category: 'Efeito' }, 
    { name: 'Ataque de Tubarão', price: 37000, icon: '🦈', category: 'Efeito' }, 
    { name: 'Nuvem de Trovão', price: 31000, icon: '⛈️', category: 'Efeito' }, 
    { name: 'Flor de Lótus', price: 21000, icon: '🌸', category: 'Efeito' }, 
    { name: 'Chuva de Rosas', price: 26000, icon: '🌹', category: 'Efeito' }, 
    { name: 'Show de Luzes', price: 34000, icon: '🎇', category: 'Efeito' }, 
    
    // Entrada
    { name: 'Entrada de Carro de Luxo', price: 1000, icon: '🏎️', category: 'Entrada' }, 
    { name: 'Entrada Fênix de Fogo', price: 5000, icon: '🔥', category: 'Entrada' }, 
    { name: 'Entrada Dragão Místico', price: 10000, icon: '🐉', category: 'Entrada' }, 
    { name: 'Tapete Mágico', price: 12000, icon: '🧞', category: 'Entrada' },
    { name: 'Entrada de Moto Esportiva', price: 2000, icon: '🏍️', category: 'Entrada' }, 
    { name: 'Chegada de Limousine', price: 8000, icon: '🚘', category: 'Entrada' }, 
    { name: 'Pouso de Pégaso', price: 15000, icon: '🦄', category: 'Entrada' },
    { name: 'Teletransporte', price: 7000, icon: '🌀', category: 'Entrada' },
    { name: 'Surfando na Onda', price: 6000, icon: '🏄', category: 'Entrada' },
    { name: 'Skate Voador', price: 4000, icon: '🛹', category: 'Entrada' },
    { name: 'Chegada de Tanque', price: 9000, icon: '💣', category: 'Entrada' },
    { name: 'Nuvem Voadora', price: 3000, icon: '☁️', category: 'Entrada' },
    { name: 'Carruagem Real', price: 11000, icon: '👑', category: 'Entrada' },
    { name: 'Chegada de Submarino', price: 13000, icon: '🌊', category: 'Entrada' },
    { name: 'Trono Flutuante', price: 18000, icon: '✨', category: 'Entrada' },
    { name: 'Jetpack', price: 5500, icon: '🚀', category: 'Entrada' },
    { name: 'Aparição Fantasma', price: 4500, icon: '👻', category: 'Entrada' },
    { name: 'Explosão de Flores', price: 3500, icon: '🌸', category: 'Entrada' },
    { name: 'Caminho de Estrelas', price: 6500, icon: '⭐', category: 'Entrada' }
];

mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin').then(async () => {
    // Limpar presentes existentes
    await Gift.deleteMany({});
    console.log('🗑️ Cleared existing gifts');
    
    // Criar todos os presentes
    const giftsToCreate = allGifts.map((gift, index) => ({
        ...gift,
        id: `gift_${index + 1}`,
        triggersAutoFollow: gift.triggersAutoFollow || false
    }));
    
    // Inserir em lotes para evitar sobrecarga
    const batchSize = 50;
    let created = 0;
    
    for (let i = 0; i < giftsToCreate.length; i += batchSize) {
        const batch = giftsToCreate.slice(i, i + batchSize);
        await Gift.insertMany(batch);
        created += batch.length;
        console.log(`📦 Created batch ${Math.floor(i/batchSize) + 1}: ${batch.length} gifts`);
    }
    
    console.log(`✅ Successfully created ${created} gifts in database`);
    console.log('📊 Categories:');
    
    // Contar por categoria
    const categories = ['Popular', 'Atividade', 'Luxo', 'VIP', 'Efeito', 'Entrada'];
    for (const category of categories) {
        const count = giftsToCreate.filter(g => g.category === category).length;
        console.log(`   ${category}: ${count} gifts`);
    }
    
    process.exit(0);
}).catch(err => { 
    console.error('❌ Error:', err.message); 
    process.exit(1); 
});
