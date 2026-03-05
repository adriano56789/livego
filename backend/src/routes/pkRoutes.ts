import express from 'express';

const router = express.Router();

router.get('/config', async (req, res) => res.json({ duration: 300 }));
router.post('/config', async (req, res) => res.json({ success: true, config: {} }));
router.post('/start', async (req, res) => res.json({ success: true }));
router.post('/end', async (req, res) => res.json({ success: true }));
router.post('/heart', async (req, res) => res.json({ success: true }));

export default router;
