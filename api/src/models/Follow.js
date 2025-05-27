const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice composto para garantir que um usuário só possa seguir outro uma vez
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Middleware para atualizar as listas de seguidores/seguindo nos modelos User
followSchema.post('save', async function(doc) {
  const User = mongoose.model('User');
  
  // Adiciona o usuário seguido à lista de seguindo do seguidor
  await User.findByIdAndUpdate(doc.follower, {
    $addToSet: { following: doc.following }
  });
  
  // Adiciona o seguidor à lista de seguidores do usuário seguido
  await User.findByIdAndUpdate(doc.following, {
    $addToSet: { followers: doc.follower }
  });
});

// Middleware para remover das listas quando um follow for removido
followSchema.post('remove', async function(doc) {
  const User = mongoose.model('User');
  
  // Remove o usuário seguido da lista de seguindo do seguidor
  await User.findByIdAndUpdate(doc.follower, {
    $pull: { following: doc.following }
  });
  
  // Remove o seguidor da lista de seguidores do usuário seguido
  await User.findByIdAndUpdate(doc.following, {
    $pull: { followers: doc.follower }
  });
});

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
