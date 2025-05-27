const express = require('express');
const router = express.Router();
const { 
  getActiveStreams, 
  getFollowedStreams, 
  getStreamById, 
  getStreamByUsername, 
  updateStream, 
  incrementViewCount, 
  decrementViewCount 
} = require('../controllers/stream.controller');
const { protect } = require('../middleware/auth');

// Rotas públicas
router.get('/active', getActiveStreams);
router.get('/:id', getStreamById);
router.get('/user/:username', getStreamByUsername);

// Rotas protegidas
router.get('/following', protect, getFollowedStreams);
router.put('/:id', protect, updateStream);

// Rotas para gerenciar visualizações
router.post('/:id/view', incrementViewCount);
router.delete('/:id/view', decrementViewCount);

module.exports = router;
