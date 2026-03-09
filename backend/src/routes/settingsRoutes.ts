import express from 'express';
import { User } from '../models';
import { standardizeUserResponse } from '../utils/userResponse';

const router = express.Router();

// Notification Settings - Usa campos do User
router.get('/notifications/settings/:id', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Retornar configurações baseadas nos campos do usuário
        const settings = {
            userId: user.id,
            newMessages: true, // padrão
            streamerLive: true, // padrão
            followedPosts: true, // padrão
            pedido: true, // padrão
            interactive: true, // padrão
        };
        
        res.json(settings);
    } catch (error: any) {
        console.error('Error getting notification settings:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/notifications/settings/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { settings } = req.body;
        
        if (!settings) {
            return res.status(400).json({ error: 'Settings are required' });
        }
        
        // Salvar configurações nos campos existentes do User
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { 
                // Adicionar campos se não existirem ou usar campos existentes
                showActivityStatus: Boolean(settings.interactive),
                lastSeen: new Date().toISOString()
            },
            { new: true }
        );
        
        res.json({ success: true, settings });
    } catch (error: any) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Gift Notification Settings - Usa campos do User
router.get('/settings/gift-notifications/:id', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Retornar configurações baseadas em showActivityStatus
        const settings = {
            enabled: user.showActivityStatus || true
        };
        
        res.json({ settings });
    } catch (error: any) {
        console.error('Error getting gift notification settings:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings/gift-notifications/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { settings } = req.body;
        
        if (!settings) {
            return res.status(400).json({ error: 'Settings are required' });
        }
        
        // Salvar configurações em showActivityStatus
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { showActivityStatus: Boolean(settings.enabled) },
            { new: true }
        );
        
        res.json({ success: true, settings });
    } catch (error: any) {
        console.error('Error updating gift notification settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Beauty Settings - Usa campos do User
router.get('/settings/beauty/:id', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Retornar configurações de beleza (padrão vazio)
        const settings = {}; // Pode ser expandido no futuro
        
        res.json({ settings });
    } catch (error: any) {
        console.error('Error getting beauty settings:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings/beauty/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { settings } = req.body;
        
        if (!settings) {
            return res.status(400).json({ error: 'Settings are required' });
        }
        
        // No momento, apenas confirma sucesso (pode ser expandido)
        res.json({ success: true, settings });
    } catch (error: any) {
        console.error('Error updating beauty settings:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/settings/private-stream/:id', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Retornar configurações padrão se não existirem
        const defaultSettings = {
            privateInvite: false,
            followersOnly: false,
            fansOnly: false,
            friendsOnly: false
        };
        
        const settings = user.privateStreamSettings || defaultSettings;
        console.log(`🔓 Getting private stream settings for user ${req.params.id}:`, settings);
        
        res.json({ settings });
    } catch (error: any) {
        console.error('Error getting private stream settings:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings/private-stream/:id', async (req, res) => {
    try {
        const { settings } = req.body;
        const userId = req.params.id;
        
        if (!settings) {
            return res.status(400).json({ error: 'Settings are required' });
        }
        
        // Validar configurações
        const validSettings = {
            privateInvite: Boolean(settings.privateInvite),
            followersOnly: Boolean(settings.followersOnly),
            fansOnly: Boolean(settings.fansOnly),
            friendsOnly: Boolean(settings.friendsOnly)
        };
        
        console.log(`🔒 Updating private stream settings for user ${userId}:`, validSettings);
        
        const user = await User.findOneAndUpdate(
            { id: userId }, 
            { privateStreamSettings: validSettings }, 
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user: standardizeUserResponse(user) });
    } catch (error: any) {
        console.error('Error updating private stream settings:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings/pip/toggle/:id', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { pipEnabled: req.body.enabled }, { new: true });
    res.json({ success: !!user, user: standardizeUserResponse(user) || {} as any });
});

router.get('/permissions/camera/:id', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ status: user.locationPermission || 'granted' });
    } catch (error: any) {
        console.error('Error getting camera permissions:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/permissions/camera/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.params.id;
        
        if (!status || !['granted', 'denied', 'prompt'].includes(status)) {
            return res.status(400).json({ error: 'Invalid permission status' });
        }
        
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { locationPermission: status },
            { new: true }
        );
        
        res.json({ success: !!updatedUser, status: status });
    } catch (error: any) {
        console.error('Error updating camera permissions:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/permissions/microphone/:id', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ status: user.locationPermission || 'granted' });
    } catch (error: any) {
        console.error('Error getting microphone permissions:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/permissions/microphone/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.params.id;
        
        if (!status || !['granted', 'denied', 'prompt'].includes(status)) {
            return res.status(400).json({ error: 'Invalid permission status' });
        }
        
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { locationPermission: status },
            { new: true }
        );
        
        res.json({ success: !!updatedUser, status: status });
    } catch (error: any) {
        console.error('Error updating microphone permissions:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/chat-permission/status/:id', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    res.json({ permission: user?.chatPermission || 'all' });
});
router.post('/chat-permission/update/:id', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { chatPermission: req.body.permission }, { new: true });
    res.json({ success: !!user, user: standardizeUserResponse(user) || {} as any });
});

export default router;
