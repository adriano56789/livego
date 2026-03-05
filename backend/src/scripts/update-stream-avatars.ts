import mongoose from 'mongoose';
import { Streamer, User } from '../models';

mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin').then(async () => {
  const streams = await Streamer.find();
  console.log('Updating', streams.length, 'streams with avatars...');
  
  for (const stream of streams) {
    const user = await User.findOne({ id: stream.hostId });
    const userAvatar = user?.avatarUrl || '';
    
    // Usar avatar do usuário ou gerar um aleatório
    const avatarUrl = userAvatar || `https://picsum.photos/200/200?random=${stream.id}`;
    
    await Streamer.updateOne(
      { id: stream.id },
      { avatar: avatarUrl }
    );
    
    console.log('Updated stream:', stream.name, '->', avatarUrl);
  }
  
  console.log('✅ All streams updated with avatars');
  process.exit(0);
}).catch(err => { 
  console.error('Error:', err.message); 
  process.exit(1); 
});
