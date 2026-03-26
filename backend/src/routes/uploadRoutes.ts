import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { User, ProfilePhoto, Streamer } from '../models';

const router = express.Router();

// Configuração do Multer para upload de arquivos de avatar
const avatarStorage = multer.diskStorage({
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

// Configuração do Multer para upload de imagens de chat
const chatStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/chat');
        
        // Criar diretório se não existir
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Gerar nome único: chat_timestamp.extensão
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `chat_${uniqueSuffix}${ext}`);
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
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

const chatUpload = multer({
    storage: chatStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max para chat
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
router.post('/avatar/:userId', avatarUpload.single('avatar'), async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nenhum arquivo enviado' 
            });
        }

        // Construir URL da imagem (suporte dev: base dinâmica)
        const baseUrl = process.env.BASE_URL || (req.protocol && req.get('host') ? `${req.protocol}://${req.get('host')}` : 'https://livego.store');
        const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
        
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

        // Emitir evento WebSocket para atualização em tempo real em todos os clientes
        const io = req.app.get('io');
        if (io) {
            io.emit('avatar_updated', { userId, avatarUrl, timestamp: new Date().toISOString() });
        }

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

// POST /api/upload/chat - Upload de imagem para chat
router.post('/chat', chatUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nenhum arquivo enviado' 
            });
        }

        // Construir URL da imagem
        const baseUrl = process.env.BASE_URL || (req.protocol && req.get('host') ? `${req.protocol}://${req.get('host')}` : 'https://livego.store');
        const imageUrl = `${baseUrl}/uploads/chat/${req.file.filename}`;
        
        console.log(`📸 Upload de imagem para chat: ${imageUrl}`);

        res.json({
            success: true,
            imageUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            message: 'Imagem enviada com sucesso'
        });

    } catch (error: any) {
        console.error('❌ Erro ao fazer upload de imagem para chat:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao fazer upload da imagem',
            details: error.message
        });
    }
});

export default router;
