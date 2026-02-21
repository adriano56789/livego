
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Gift from '../models/Gift';

dotenv.config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/livego';

interface SeedGift {
  name: string;
  price: number;
  icon: string;
  category: string;
  type: string;
  videoUrl?: string;
  triggersAutoFollow?: boolean;
  isActive?: boolean;
}

const giftsData: SeedGift[] = [
  // --- Popular ---
  { name: 'Coração', price: 1, icon: '❤️', category: 'Popular', type: 'emoji' },
  { name: 'Café', price: 3, icon: '☕', category: 'Popular', type: 'emoji' },
  { name: 'Milho', price: 2, icon: '🍿', category: 'Popular', type: 'emoji' },
  { name: 'Rosa', price: 5, icon: '🌷', category: 'Popular', type: 'emoji' },
  { name: 'Flor', price: 7, icon: '🌸', category: 'Popular', type: 'emoji' },
  { name: 'Donut', price: 8, icon: '🍩', category: 'Popular', type: 'emoji' },
  { name: 'Balão', price: 9, icon: '🎈', category: 'Popular', type: 'emoji' },
  { name: 'Batom', price: 10, icon: '💄', category: 'Popular', type: 'emoji' },
  { name: 'Chocolate', price: 12, icon: '🍫', category: 'Popular', type: 'emoji' },
  { name: 'Sorvete', price: 15, icon: '🍦', category: 'Popular', type: 'emoji' },
  { name: 'Lanche', price: 20, icon: '🍔', category: 'Popular', type: 'emoji' },
  { name: 'Perfume', price: 25, icon: '🧴', category: 'Popular', type: 'emoji' },
  { name: 'Pirulito', price: 30, icon: '🍭', category: 'Popular', type: 'emoji' },
  { name: 'Pizza', price: 35, icon: '🍕', category: 'Popular', type: 'emoji' },
  { name: 'Microfone', price: 40, icon: '🎤', category: 'Popular', type: 'emoji' },
  { name: 'Alvo', price: 50, icon: '🎯', category: 'Popular', type: 'emoji' },
  { name: 'Câmera', price: 60, icon: '📸', category: 'Popular', type: 'emoji' },
  { name: 'Óculos de Sol', price: 80, icon: '😎', category: 'Popular', type: 'emoji' },
  { name: 'Panda', price: 65, icon: '🐼', category: 'Popular', type: 'emoji' },
  { name: 'Coala', price: 68, icon: '🐨', category: 'Popular', type: 'emoji' },
  { name: 'Fatia de Pizza', price: 10, icon: '🍕', category: 'Popular', type: 'emoji' },
  { name: 'Taco', price: 15, icon: '🌮', category: 'Popular', type: 'emoji' },
  { name: 'Biscoito', price: 5, icon: '🍪', category: 'Popular', type: 'emoji' },
  { name: 'Cupcake', price: 8, icon: '🧁', category: 'Popular', type: 'emoji' },
  { name: 'Morango', price: 12, icon: '🍓', category: 'Popular', type: 'emoji' },
  { name: 'Abacate', price: 18, icon: '🥑', category: 'Popular', type: 'emoji' },
  { name: 'Brócolis', price: 4, icon: '🥦', category: 'Popular', type: 'emoji' },
  { name: 'Baguete', price: 6, icon: '🥖', category: 'Popular', type: 'emoji' },
  { name: 'Pretzel', price: 7, icon: '🥨', category: 'Popular', type: 'emoji' },
  { name: 'Queijo', price: 11, icon: '🧀', category: 'Popular', type: 'emoji' },
  { name: 'Waffle', price: 14, icon: '🧇', category: 'Popular', type: 'emoji' },
  { name: 'Panquecas', price: 16, icon: '🥞', category: 'Popular', type: 'emoji' },
  { name: 'Bacon', price: 19, icon: '🥓', category: 'Popular', type: 'emoji' },
  { name: 'Cachorro-quente', price: 22, icon: '🌭', category: 'Popular', type: 'emoji' },
  { name: 'Batata Frita', price: 9, icon: '🍟', category: 'Popular', type: 'emoji' },
  { name: 'Sanduíche', price: 24, icon: '🥪', category: 'Popular', type: 'emoji' },
  { name: 'Dango', price: 13, icon: '🍡', category: 'Popular', type: 'emoji' },
  { name: 'Onigiri', price: 5, icon: '🍙', category: 'Popular', type: 'emoji' },
  { name: 'Camarão Frito', price: 28, icon: '🍤', category: 'Popular', type: 'emoji' },
  { name: 'Sushi', price: 33, icon: '🍣', category: 'Popular', type: 'emoji' },
  { name: 'Taça de Sorvete', price: 17, icon: '🍨', category: 'Popular', type: 'emoji' },
  { name: 'Torta', price: 21, icon: '🥧', category: 'Popular', type: 'emoji' },
  { name: 'Doce', price: 3, icon: '🍬', category: 'Popular', type: 'emoji' },
  { name: 'Mel', price: 26, icon: '🍯', category: 'Popular', type: 'emoji' },
  { name: 'Copo de Leite', price: 8, icon: '🥛', category: 'Popular', type: 'emoji' },
  { name: 'Chá Verde', price: 10, icon: '🍵', category: 'Popular', type: 'emoji' },
  { name: 'Saquê', price: 29, icon: '🍶', category: 'Popular', type: 'emoji' },
  { name: 'Cerveja', price: 15, icon: '🍺', category: 'Popular', type: 'emoji' },
  { name: 'Milkshake', price: 22, icon: '🥤', category: 'Popular', type: 'emoji' },
  { name: 'Croissant', price: 11, icon: '🥐', category: 'Popular', type: 'emoji' },
  { name: 'Uvas', price: 14, icon: '🍇', category: 'Popular', type: 'emoji' },
  { name: 'Frango Frito', price: 27, icon: '🍗', category: 'Popular', type: 'emoji' },
  { name: 'Melancia', price: 10, icon: '🍉', category: 'Popular', type: 'emoji' },

  // --- Atividade ---
  { name: 'Bola de Basquete', price: 70, icon: '🏀', category: 'Atividade', type: 'emoji' },
  { name: 'Bola', price: 75, icon: '⚽', category: 'Atividade', type: 'emoji' },
  { name: 'Túmulo', price: 99, icon: '🪦', category: 'Atividade', type: 'emoji' },
  { name: 'Bicicleta', price: 110, icon: '🚲', category: 'Atividade', type: 'emoji' },
  { name: 'Haltere', price: 120, icon: '💪', category: 'Atividade', type: 'emoji' },
  { name: 'Skate', price: 130, icon: '🛹', category: 'Atividade', type: 'emoji' },
  { name: 'Prancha de Surf', price: 140, icon: '🏄', category: 'Atividade', type: 'emoji' },
  { name: 'Luva de Boxe', price: 160, icon: '🥊', category: 'Atividade', type: 'emoji' },
  { name: 'Taco de Golfe', price: 180, icon: '🏌️', category: 'Atividade', type: 'emoji' },
  { name: 'Capacete de Corrida', price: 210, icon: '⛑️', category: 'Atividade', type: 'emoji' },
  { name: 'Bola de Tênis', price: 85, icon: '🎾', category: 'Atividade', type: 'emoji' },
  { name: 'Boliche', price: 95, icon: '🎳', category: 'Atividade', type: 'emoji' },
  { name: 'Bola de Rugby', price: 105, icon: '🏉', category: 'Atividade', type: 'emoji' },
  { name: 'Voleibol', price: 90, icon: '🏐', category: 'Atividade', type: 'emoji' },
  { name: 'Beisebol', price: 80, icon: '⚾', category: 'Atividade', type: 'emoji' },
  { name: 'Pingue-pongue', price: 78, icon: '🏓', category: 'Atividade', type: 'emoji' },
  { name: 'Badminton', price: 82, icon: '🏸', category: 'Atividade', type: 'emoji' },
  { name: 'Hóquei no Gelo', price: 150, icon: '🏒', category: 'Atividade', type: 'emoji' },
  { name: 'Hóquei de Campo', price: 145, icon: '🏑', category: 'Atividade', type: 'emoji' },
  { name: 'Lacrosse', price: 155, icon: '🥍', category: 'Atividade', type: 'emoji' },
  { name: 'Críquete', price: 115, icon: '🏏', category: 'Atividade', type: 'emoji' },
  { name: 'Rede de Gol', price: 190, icon: '🥅', category: 'Atividade', type: 'emoji' },
  { name: 'Pipa', price: 65, icon: '🪁', category: 'Atividade', type: 'emoji' },
  { name: 'Frisbee', price: 55, icon: '🥏', category: 'Atividade', type: 'emoji' },
  { name: 'Trenzinho', price: 220, icon: '🛷', category: 'Atividade', type: 'emoji' },
  { name: 'Pedra de Curling', price: 230, icon: '🥌', category: 'Atividade', type: 'emoji' },
  { name: 'Esquis', price: 250, icon: '🎿', category: 'Atividade', type: 'emoji', triggersAutoFollow: true },
  { name: 'Dardos', price: 45, icon: '🎯', category: 'Atividade', type: 'emoji' },
  { name: 'Ioiô', price: 35, icon: '🪀', category: 'Atividade', type: 'emoji' },
  { name: 'Bumerangue', price: 40, icon: '🪃', category: 'Atividade', type: 'emoji' },
  { name: 'Trenó', price: 170, icon: '🛷', category: 'Atividade', type: 'emoji' },
  { name: 'Arco e Flecha', price: 190, icon: '🏹', category: 'Atividade', type: 'emoji' },
  { name: 'Patins', price: 135, icon: '🛼', category: 'Atividade', type: 'emoji' },

  // --- Luxo ---
  { name: 'Urso', price: 500, icon: '🧸', category: 'Luxo', type: 'emoji' },
  { name: 'Boia', price: 800, icon: '🍩', category: 'Luxo', type: 'emoji' },
  { name: 'Champanhe', price: 1200, icon: '🍾', category: 'Luxo', type: 'emoji' },
  { name: 'Gema de Nível', price: 1500, icon: '💎', category: 'Luxo', type: 'emoji' },
  { name: 'Relógio', price: 2000, icon: '⌚', category: 'Luxo', type: 'emoji' },
  { name: 'Bolsa', price: 2500, icon: '👜', category: 'Luxo', type: 'emoji' },
  { name: 'Moto', price: 3000, icon: '🛵', category: 'Luxo', type: 'emoji' },
  { name: 'Violino', price: 3500, icon: '🎻', category: 'Luxo', type: 'emoji' },
  { name: 'Salto Alto', price: 4000, icon: '👠', category: 'Luxo', type: 'emoji' },
  { name: 'Piano', price: 4500, icon: '🎹', category: 'Luxo', type: 'emoji' },
  { name: 'Colar', price: 4800, icon: '📿', category: 'Luxo', type: 'emoji' },
  { name: 'Coroa', price: 5000, icon: '👑', category: 'Luxo', type: 'emoji', triggersAutoFollow: true },
  { name: 'Bolsa de Grife', price: 6000, icon: '👜', category: 'Luxo', type: 'emoji' },
  { name: 'Diamante Azul', price: 6000, icon: '💠', category: 'Luxo', type: 'emoji' },
  { name: 'Carro Esportivo', price: 8888, icon: '🏎️', category: 'Luxo', type: 'video', triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
  { name: 'Jóia Rara', price: 12000, icon: '💍', category: 'Luxo', type: 'video', triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
  { name: 'Barco a Vela', price: 9000, icon: '⛵', category: 'Luxo', type: 'video', triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { name: 'Navio de Cruzeiro', price: 15000, icon: '🛳️', category: 'Luxo', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { name: 'Sino', price: 1800, icon: '🔔', category: 'Luxo', type: 'emoji' },
  { name: 'Trompete', price: 2200, icon: '🎺', category: 'Luxo', type: 'emoji' },
  { name: 'Saxofone', price: 2800, icon: '🎷', category: 'Luxo', type: 'emoji' },
  { name: 'Acordeão', price: 3200, icon: '🪗', category: 'Luxo', type: 'emoji' },
  { name: 'Harpa', price: 4200, icon: '🎻', category: 'Luxo', type: 'emoji' },
  { name: 'Xadrez', price: 1000, icon: '♟️', category: 'Luxo', type: 'emoji' },
  { name: 'Jóia', price: 7500, icon: '💎', category: 'Luxo', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
  { name: 'Mala de Dinheiro', price: 10000, icon: '💰', category: 'Luxo', type: 'emoji' },
  { name: 'Carta de Baralho', price: 900, icon: '🃏', category: 'Luxo', type: 'emoji' },
  { name: 'Telescópio', price: 5500, icon: '🔭', category: 'Luxo', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { name: 'Microscópio', price: 5200, icon: '🔬', category: 'Luxo', type: 'emoji' },
  { name: 'Ampulheta', price: 1300, icon: '⏳', category: 'Luxo', type: 'emoji' },
  { name: 'Despertador', price: 1100, icon: '⏰', category: 'Luxo', type: 'emoji' },
  { name: 'Globo', price: 3800, icon: '🌍', category: 'Luxo', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { name: 'Balão de Ar Quente', price: 4600, icon: '🎈', category: 'Luxo', type: 'emoji' },
  { name: 'Troféu', price: 9999, icon: '🏆', category: 'Luxo', type: 'emoji' },
  { name: 'Barra de Ouro', price: 7000, icon: '🧈', category: 'Luxo', type: 'emoji' },
  { name: 'Cofre de Diamantes', price: 11000, icon: '💰', category: 'Luxo', type: 'emoji' },
  { name: 'Chave do Carro', price: 9500, icon: '🔑', category: 'Luxo', type: 'emoji' },
  { name: 'Cetro Real', price: 13000, icon: '👑', category: 'Luxo', type: 'emoji' },

  // --- VIP ---
  { name: 'Foguete', price: 500, icon: '🚀', category: 'VIP', type: 'video', triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { name: 'Jato Privado', price: 600, icon: '✈️', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { name: 'Anel', price: 750, icon: '💍', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
  { name: 'Leão', price: 800, icon: '🦁', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { name: 'Carro', price: 1000, icon: '🚗', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
  { name: 'Fênix', price: 1200, icon: '🔥', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { name: 'Supercarro', price: 1500, icon: '🏎️', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' },
  { name: 'Dragão', price: 1800, icon: '🐉', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { name: 'Castelo', price: 2000, icon: '🏰', category: 'VIP', type: 'video', triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
  { name: 'Universo', price: 2500, icon: '🌌', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { name: 'Helicóptero', price: 3000, icon: '🚁', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { name: 'Planeta', price: 4000, icon: '🪐', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { name: 'Iate', price: 5000, icon: '🛥️', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { name: 'Galáxia', price: 6000, icon: '🌠', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { name: 'Coroa Real', price: 8000, icon: '🤴', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
  { name: 'Diamante VIP', price: 10000, icon: '💎', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
  { name: 'Ilha Particular', price: 15000, icon: '🏝️', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { name: 'Cavalo Alado', price: 25000, icon: '🦄', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { name: 'Tigre Dourado', price: 40000, icon: '🐅', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { name: 'Nave Espacial', price: 75000, icon: '🛸', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { name: 'Estrela Cadente', price: 22000, icon: '🌠', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { name: 'Cometa', price: 35000, icon: '☄️', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { name: 'Buraco Negro', price: 99999, icon: '⚫', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { name: 'Tesouro', price: 50000, icon: '👑', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
  { name: 'Pégaso', price: 60000, icon: '🦄', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { name: 'Grifo', price: 65000, icon: '🦅', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { name: 'Kraken', price: 70000, icon: '🐙', category: 'VIP', type: 'component' },
  { name: 'Hidra', price: 80000, icon: '🐉', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { name: 'Sereia', price: 45000, icon: '🧜‍♀️', category: 'VIP', type: 'component' },
  { name: 'Gênio', price: 55000, icon: '🧞', category: 'VIP', type: 'component' },
  { name: 'Anjo', price: 48000, icon: '👼', category: 'VIP', type: 'component' },
  { name: 'Excalibur', price: 42000, icon: '🗡️', category: 'VIP', type: 'component' },
  { name: 'Martelo de Thor', price: 68000, icon: '🔨', category: 'VIP', type: 'component' },
  { name: 'Tridente de Poseidon', price: 72000, icon: '🔱', category: 'VIP', type: 'component' },
  { name: 'Arco de Artemis', price: 62000, icon: '🏹', category: 'VIP', type: 'component' },
  { name: 'Elmo de Hades', price: 58000, icon: '🎩', category: 'VIP', type: 'component' },
  { name: 'Sandálias de Hermes', price: 52000, icon: '👟', category: 'VIP', type: 'component' },
  { name: 'Velo de Ouro', price: 90000, icon: '🏆', category: 'VIP', type: 'component' },
  { name: 'Maçã Dourada', price: 43000, icon: '🍏', category: 'VIP', type: 'component' },
  { name: 'Caixa de Pandora', price: 85000, icon: '🎁', category: 'VIP', type: 'component' },
  { name: 'Foguete Espacial', price: 25000, icon: '🚀', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { name: 'Disco Voador', price: 30000, icon: '🛸', category: 'VIP', type: 'video', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { name: 'Jet Ski', price: 700, icon: '🚤', category: 'VIP', type: 'component' },
  { name: 'Ilha Flutuante', price: 16000, icon: '🏝️', category: 'VIP', type: 'component' },
  { name: 'Trem Bala', price: 9000, icon: '🚄', category: 'VIP', type: 'component' },
  { name: 'Dirigível', price: 11000, icon: '🎈', category: 'VIP', type: 'component' },

  // --- Efeito ---
  { name: 'Explosão de Confete', price: 19000, icon: '🎉', category: 'Efeito', type: 'component' },
  { name: 'Invocação de Dragão', price: 80000, icon: '🐲', category: 'Efeito', type: 'component' },
  { name: 'Coração Gigante', price: 28000, icon: '❤️‍🔥', category: 'Efeito', type: 'component' },
  { name: 'Beijo de Anjo', price: 23000, icon: '😘', category: 'Efeito', type: 'component' },
  { name: 'Dança dos Robôs', price: 33000, icon: '🤖', category: 'Efeito', type: 'component' },
  { name: 'Portal Galáctico', price: 42000, icon: '🌀', category: 'Efeito', type: 'component' },
  { name: 'Ataque de Tubarão', price: 37000, icon: '🦈', category: 'Efeito', type: 'component' },
  { name: 'Nuvem de Trovão', price: 31000, icon: '⛈️', category: 'Efeito', type: 'component' },
  { name: 'Flor de Lótus', price: 21000, icon: '🌸', category: 'Efeito', type: 'component' },
  { name: 'Chuva de Rosas', price: 26000, icon: '🌹', category: 'Efeito', type: 'component' },
  { name: 'Show de Luzes', price: 34000, icon: '🎇', category: 'Efeito', type: 'component' },

  // --- Entrada ---
  { name: 'Entrada de Carro de Luxo', price: 1000, icon: '🏎️', category: 'Entrada', type: 'component' },
  { name: 'Entrada Fênix de Fogo', price: 5000, icon: '🔥', category: 'Entrada', type: 'component' },
  { name: 'Entrada Dragão Místico', price: 10000, icon: '🐉', category: 'Entrada', type: 'component' },
  { name: 'Tapete Mágico', price: 12000, icon: '🧞', category: 'Entrada', type: 'component' },
  { name: 'Entrada de Moto Esportiva', price: 2000, icon: '🏍️', category: 'Entrada', type: 'component' },
  { name: 'Chegada de Limousine', price: 8000, icon: '🚘', category: 'Entrada', type: 'component' },
  { name: 'Pouso de Pégaso', price: 15000, icon: '🦄', category: 'Entrada', type: 'component' },
  { name: 'Teletransporte', price: 7000, icon: '🌀', category: 'Entrada', type: 'component' },
  { name: 'Surfando na Onda', price: 6000, icon: '🏄', category: 'Entrada', type: 'component' },
  { name: 'Skate Voador', price: 4000, icon: '🛹', category: 'Entrada', type: 'component' },
  { name: 'Chegada de Tanque', price: 9000, icon: '💣', category: 'Entrada', type: 'component' },
  { name: 'Nuvem Voadora', price: 3000, icon: '☁️', category: 'Entrada', type: 'component' },
  { name: 'Carruagem Real', price: 11000, icon: '👑', category: 'Entrada', type: 'component' },
  { name: 'Chegada de Submarino', price: 13000, icon: '🌊', category: 'Entrada', type: 'component' },
  { name: 'Trono Flutuante', price: 18000, icon: '✨', category: 'Entrada', type: 'component' },
  { name: 'Jetpack', price: 5500, icon: '🚀', category: 'Entrada', type: 'component' },
  { name: 'Aparição Fantasma', price: 4500, icon: '👻', category: 'Entrada', type: 'component' },
  { name: 'Explosão de Flores', price: 3500, icon: '🌸', category: 'Entrada', type: 'component' },
  { name: 'Caminho de Estrelas', price: 6500, icon: '⭐', category: 'Entrada', type: 'component' }
];

const seedGifts = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected.');

    console.log(`[Seed] Processing ${giftsData.length} gifts...`);
    
    for (const gift of giftsData) {
      await Gift.findOneAndUpdate(
        { name: gift.name },
        { 
          $set: {
            ...gift,
            isActive: true 
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('[Seed] Gifts seeded successfully.');
  } catch (error) {
    console.error('[Seed] Error seeding gifts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected.');
  }
};

seedGifts();
