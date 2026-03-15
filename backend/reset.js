const mongoose = require('mongoose');

async function reset() {
  await mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin');
  
  const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
  const User = mongoose.model('User', userSchema);
  
  const res = await User.updateMany(
    { name: /adriano/i },
    { $set: { enviados: 0, receptores: 0, earnings: 0 } }
  );
  
  console.log('Reset completed:', res);
  process.exit(0);
}

reset().catch(console.error);
