import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import {
  getUserProfile,
  updateProfile,
  updatePassword,
  updateAvatar,
  toggleFollow,
  toggleBlock,
  getFollowing,
  getFollowers,
  searchUsers,
  getLiveFollowedStreams,
  checkUsernameAvailability,
  deleteAccount,
  regenerateStreamKey
} from '../controllers/user.controller.js';

const router = express.Router();

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
});

// Rotas públicas
router.get('/:id', getUserProfile);
router.get('/search', searchUsers);
router.get('/check-username/:username', checkUsernameAvailability);

// Rotas protegidas (requer autenticação)
router.use(protect);

// Perfil do usuário
router.route('/me')
  .put(updateProfile)
  .delete(deleteAccount);

// Senha
router.put('/me/password', updatePassword);

// Avatar
router.put('/me/avatar', upload.single('avatar'), updateAvatar);

// Seguidores/Seguindo
router.get('/me/following', getFollowing);
router.get('/me/following/live', getLiveFollowedStreams);
router.get('/me/followers', getFollowers);

// Ações de usuário
router.post('/:id/follow', toggleFollow);
router.post('/:id/block', toggleBlock);

// Stream
router.post('/me/regenerate-stream-key', regenerateStreamKey);

export default router;
