const mongoose = require('mongoose');
const User = require('./src/models/User').User;

mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin')
.then(async () => {
  console.log('Conectado ao MongoDB');
  
  // Atualizar avatar do suporte
  await User.updateOne(
    { id: 'support-livercore' },
    { 
      $set: { 
        avatarUrl: 'https://picsum.photos/seed/support-livercore/200/200.jpg',
        name: 'Support',
        birthday: '04-03-1993'
      }
    }
  );
  
  console.log('Avatar do suporte atualizado');
  
  // Verificar usuário
  const support = await User.findOne({ id: 'support-livercore' });
  console.log('Dados do suporte:', {
    id: support.id,
    name: support.name,
    avatarUrl: support.avatarUrl,
    birthday: support.birthday,
    age: support.age
  });
  
  mongoose.connection.close();
})
.catch(console.error);
