import mongoose from 'mongoose';
import { Streamer } from '../models';

mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin').then(async () => {
  // Criar streams de exemplo em diferentes regiões
  await Streamer.create({
    id: 'stream_us_001',
    hostId: '12345678',
    name: 'USA Gaming Live',
    avatar: 'https://picsum.photos/200/200?random=us_001',
    location: 'New York, USA',
    time: 'Live Now',
    message: 'Gaming from United States!',
    tags: ['gaming', 'english'],
    isHot: true,
    icon: '🎮',
    country: 'us',
    viewers: 245,
    isLive: true,
    startTime: new Date().toISOString(),
    category: 'gaming',
    language: 'en'
  });

  await Streamer.create({
    id: 'stream_ar_001',
    hostId: '87654321',
    name: 'Música Argentina 🇦🇷',
    avatar: 'https://picsum.photos/200/200?random=ar_001',
    location: 'Buenos Aires, Argentina',
    time: 'Live Now',
    message: 'Música latina ao vivo!',
    tags: ['music', 'spanish'],
    isHot: false,
    icon: '🎵',
    country: 'ar',
    viewers: 89,
    isLive: true,
    startTime: new Date().toISOString(),
    category: 'music',
    language: 'es'
  });

  await Streamer.create({
    id: 'stream_mx_001',
    hostId: '99999999',
    name: 'Chat desde México 🇲🇽',
    avatar: 'https://picsum.photos/200/200?random=mx_001',
    location: 'Cidade do México, México',
    time: 'Live Now',
    message: 'Conversemos en español!',
    tags: ['chat', 'spanish'],
    isHot: false,
    icon: '💬',
    country: 'mx',
    viewers: 156,
    isLive: true,
    startTime: new Date().toISOString(),
    category: 'chat',
    language: 'es'
  });

  console.log('✅ Created sample streams in different regions');
  process.exit(0);
}).catch(err => { 
  console.error('Error:', err.message); 
  process.exit(1); 
});
