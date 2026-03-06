import express from 'express';
import { User } from '../models';

const router = express.Router();

router.get('/notifications/settings/:id', async (req, res) => res.json({}));
router.post('/notifications/settings/:id', async (req, res) => res.json({ settings: {} }));
router.get('/settings/gift-notifications/:id', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    res.json({ settings: user?.showActivityStatus ? { enabled: true } : {} });
});
router.post('/settings/gift-notifications/:id', async (req, res) => res.json({ success: true }));
router.get('/settings/beauty/:id', async (req, res) => res.json({}));
router.post('/settings/beauty/:id', async (req, res) => res.json({ success: true }));

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
        
        res.json({ success: true, user });
    } catch (error: any) {
        console.error('Error updating private stream settings:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings/pip/toggle/:id', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { pipEnabled: req.body.enabled }, { new: true });
    res.json({ success: !!user, user: user || {} as any });
});

router.get('/permissions/camera/:id', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    res.json({ status: user?.locationPermission || 'granted' });
});
router.post('/permissions/camera/:id', async (req, res) => res.json({}));
router.get('/permissions/microphone/:id', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    res.json({ status: user?.locationPermission || 'granted' });
});
router.post('/permissions/microphone/:id', async (req, res) => res.json({}));

router.get('/chat-permission/status/:id', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    res.json({ permission: user?.chatPermission || 'all' });
});
router.post('/chat-permission/update/:id', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { chatPermission: req.body.permission }, { new: true });
    res.json({ success: !!user, user: user || {} as any });
});

export default router;
