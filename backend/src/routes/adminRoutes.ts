import express from 'express';
import { PurchaseRecord } from '../models';

const router = express.Router();

router.post('/withdrawal-method', async (req, res) => res.json({ success: true, user: {} as any }));
router.post('/withdraw', async (req, res) => res.json({ success: true, message: 'Requested' }));
router.get('/history', async (req, res) => {
    const history = await PurchaseRecord.find({ status: req.query.status as string });
    res.json(history);
});

export default router;
