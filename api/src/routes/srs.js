const express = require('express');
const router = express.Router();
const { 
  onConnect, 
  onPublish, 
  onUnpublish, 
  onStop 
} = require('../controllers/srs.controller');

// Rotas para callbacks do SRS (não requerem autenticação JWT)
router.post('/on_connect', onConnect);
router.post('/on_publish', onPublish);
router.post('/on_unpublish', onUnpublish);
router.post('/on_stop', onStop);

module.exports = router;
