const express = require('express');
const router = express.Router();
const { 
  followUser, 
  unfollowUser, 
  checkIfFollowing 
} = require('../controllers/follow.controller');
const { protect } = require('../middleware/auth');

// Todas as rotas estão protegidas
router.use(protect);

// Seguir um usuário
router.post('/:userId', followUser);

// Deixar de seguir um usuário
router.delete('/:userId', unfollowUser);

// Verificar se está seguindo um usuário
router.get('/check/:userId', checkIfFollowing);

module.exports = router;
