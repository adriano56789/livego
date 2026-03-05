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
    const user = await User.findOne({ id: req.params.id });
    res.json({ settings: user?.privateStreamSettings || {} });
});
router.post('/settings/private-stream/:id', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { privateStreamSettings: req.body.settings }, { new: true });
    res.json({ success: !!user, user: user || {} as any });
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
