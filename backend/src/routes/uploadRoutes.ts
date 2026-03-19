import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { User, ProfilePhoto, Streamer } from '../models';

const router = express.Router();

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/avatars');
        
        // Criar diretório se não existir
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Gerar nome único: userId_timestamp.extensão
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${req.params.userId}_${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (req, file, cb) => {
        // Aceitar apenas imagens
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de imagem são permitidos'));
        }
    }
});

// POST /api/upload/avatar/:userId - Upload de avatar
router.post('/avatar/:userId', upload.single('avatar'), async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nenhum arquivo enviado' 
            });
        }

        // Construir URL da imagem
        const avatarUrl = `https://livego.store/uploads/avatars/${req.file.filename}`;
        
        console.log(`📸 Upload de avatar para usuário ${userId}: ${avatarUrl}`);

        // Atualizar avatarUrl do usuário
        await User.findOneAndUpdate(
            { id: userId },
            { avatarUrl }
        );

        // Criar registro em ProfilePhoto
        const newPhoto = await ProfilePhoto.create({
            id: `profile_avatar_${userId}_${Date.now()}`,
            userId,
            photoUrl: avatarUrl,
            photoType: 'avatar',
            isMain: true,
            order: 0,
            isActive: true,
            metadata: {
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                width: 0, // TODO: processar imagem para obter dimensões
                height: 0,
                uploadedAt: new Date()
            }
        });

        // Sincronizar avatar com streams ativas do usuário
        await Streamer.updateMany(
            { hostId: userId },
            { 
                avatar: avatarUrl,
                updatedAt: new Date()
            }
        );

        console.log(`✅ Avatar sincronizado com streams do usuário: ${userId}`);

        res.json({
            success: true,
            avatarUrl,
            message: 'Avatar atualizado com sucesso'
        });

    } catch (error: any) {
        console.error('❌ Erro ao fazer upload de avatar:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao fazer upload do avatar',
            details: error.message
        });
    }
});

export default router;
