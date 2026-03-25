import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import mongoose from 'mongoose';
import { standardizeUserResponse } from '../utils/userResponse';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        // Garantir conexão com MongoDB
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin');
        }

        const {
            name,
            email,
            password,
            country = "br",
            age = 25,
            gender = "male",
            bio = "",
            residence = "k",
            tags = "",
            profession = ""
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide name, email and password' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Gerar ID único de 8 dígitos (sem timestamp)
        const generateUserId = () => {
            // Gerar número aleatório de 8 dígitos
            return Math.floor(10000000 + Math.random() * 90000000).toString();
        };

        const userId = generateUserId();

        const user = await User.create({
            id: userId,
            name,
            email,
            password: hashedPassword,
            identification: userId,
            avatarUrl: "", // Frontend should handle default avatar
            coverUrl: "", // Frontend should handle default cover
            photos: [],
            country,
            age,
            gender,
            level: 1,
            xp: 0,
            fans: 0,
            following: 0,
            receptores: 0,
            enviados: 0,
            topFansAvatars: [],
            isLive: false,
            isFollowed: false,
            isOnline: true,
            diamonds: 1000,
            earnings: 0,
            earnings_withdrawn: 0,
            obras: [],
            curtidas: [],
            isVIP: false,
            isAvatarProtected: false,
            activeFrameId: null,
            chatPermission: "all",
            pipEnabled: true,
            locationPermission: "granted",
            showActivityStatus: true,
            showLocation: true,
            privateStreamSettings: {},
            platformWarnings: 0,
            frameExpiration: null,
            ownedFrames: [],
            location: residence || "Brasil",
            distance: "",
            rank: 1,
            vipSubscriptionDate: null,
            vipExpirationDate: null,
            withdrawal_method: null,
            adminWithdrawalMethod: null,
            platformEarnings: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSeen: new Date().toISOString(),
            token: "",
            currentStreamId: null,
            birthday: "01/01/1990",
            bio,
            residence,
            tags,
            profession,
            emotional_status: "0",
            followingList: [],
            blockedUsers: [],
            followersList: [],
            friendsList: []
        });

        const token = jwt.sign({ id: user.id, _id: user._id }, JWT_SECRET, { expiresIn: '30d' });

        user.token = token;
        await user.save();

        res.status(201).json({
            success: true,
            token,
            user: standardizeUserResponse(user)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        // Garantir conexão com MongoDB
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin');
        }

        const { email, password } = req.body;
        const authHeader = req.headers.authorization;

        // Se tiver token Bearer, valida e retorna usuário
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as any;
                const user = await User.findOne({ id: decoded.id });

                if (!user) {
                    return res.status(401).json({ error: 'User not found' });
                }

                // Update online status
                user.isOnline = true;
                user.lastSeen = new Date().toISOString();
                await user.save();

                return res.json({
                    success: true,
                    token,
                    user: standardizeUserResponse(user)
                });
            } catch (tokenError) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        }

        // Login tradicional com email e senha
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, _id: user._id }, JWT_SECRET, { expiresIn: '30d' });

        // Update status online and token
        user.isOnline = true;
        user.lastSeen = new Date().toISOString();
        user.token = token;
        await user.save();

        res.json({
            success: true,
            token,
            user: standardizeUserResponse(user)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const { id } = req.body;
        if (id) {
            await User.findOneAndUpdate({ id }, { isOnline: false, lastSeen: new Date().toISOString() });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// @route GET /api/accounts/google - Retorna todas as contas Google do usuário
// @route GET /api/accounts/google/connected - Alias para /api/accounts/google
router.get('/google/connected', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json([]); // Sem token = sem contas conectadas
        }

        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.json([]);
        }

        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.json([]);
        }

        // O usuário está conectado com o próprio email cadastrado
        // Retorna no formato GoogleAccount esperado pelo frontend
        const connectedAccounts = [{
            id: user.id,
            email: user.email || '',
            name: user.name,
            avatarUrl: user.avatarUrl || '',
            isConnected: true,
            user: standardizeUserResponse(user)
        }];

        res.json(connectedAccounts);
    } catch (error: any) {
        console.error('Error in /google/connected:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/google', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json([]);
        }

        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.json([]);
        }

        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.json([]);
        }

        const accounts = [{
            id: user.id,
            email: user.email || '',
            name: user.name,
            avatarUrl: user.avatarUrl || '',
            isConnected: true,
            user: standardizeUserResponse(user)
        }];

        res.json(accounts);
    } catch (error: any) {
        console.error('Error in /google:', error);
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/accounts/google/disconnect - Desconecta conta Google
router.post('/google/disconnect', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Desconectar a conta (fazer logout)
        await User.findOneAndUpdate(
            { id: decoded.id },
            { isOnline: false, lastSeen: new Date().toISOString() }
        );

        res.json({ success: true, message: 'Conta desconectada com sucesso' });
    } catch (error: any) {
        console.error('Error in /google/disconnect:', error);
        res.status(500).json({ error: error.message });
    }
});

// @route POST /api/auth/validate
router.post('/validate', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({ valid: false });
        }

        const token = authHeader.substring(7);
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            const user = await User.findOne({ id: decoded.id });

            if (!user) {
                return res.json({ valid: false });
            }

            res.json({ valid: true, user: standardizeUserResponse(user) });
        } catch (tokenError) {
            return res.json({ valid: false });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
