const express = require('express');
const router = express.Router();
const { 
  getUserProfile, 
  updateProfile, 
  regenerateStreamKey 
} = require('../controllers/user.controller');
const { 
  getUserFollowers, 
  getUserFollowing 
} = require('../controllers/follow.controller');
const { protect } = require('../middleware/auth');

// Rotas públicas
router.get('/:id', getUserProfile);
router.get('/:userId/followers', getUserFollowers);
router.get('/:userId/following', getUserFollowing);

// Rotas protegidas
router.put('/me', protect, updateProfile);
router.post('/me/regenerate-stream-key', protect, regenerateStreamKey);

module.exports = router;
