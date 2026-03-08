import express from 'express';
import { PurchaseRecord } from '../models';
import { standardizeUserResponse } from '../utils/userResponse';

const router = express.Router();

router.get('/purchases/history/:id', async (req, res) => {
    const history = await PurchaseRecord.find({ userId: req.params.id }).sort({ timestamp: -1 });
    res.json(history);
});
router.get('/earnings/get/:id', async (req, res) => {
    const user = await import('../models').then(m => m.User).then(U => U.findOne({ id: req.params.id }));
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Diamonds converted to earnings
    const available_diamonds = user.earnings || 0;
    const gross_brl = available_diamonds * 0.05; // 5 cents per diamond
    const platform_fee_brl = gross_brl * 0.10; // 10% platform fee
    const net_brl = gross_brl - platform_fee_brl;

    res.json({ available_diamonds, gross_brl, platform_fee_brl, net_brl });
});
router.post('/earnings/calculate', async (req, res) => {
    const amount = req.body.amount || 0;
    const gross_value = amount * 0.05;
    const platform_fee = gross_value * 0.10;
    const net_value = gross_value - platform_fee;
    res.json({ gross_value, platform_fee, net_value });
});
router.post('/earnings/withdraw/:id', async (req, res) => {
    try {
        const amount = req.body.amount || 0;
        const user = await import('../models').then(m => m.User).then(U => U.findOne({ id: req.params.id }));
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.earnings < amount) return res.status(400).json({ error: 'Insufficient earnings' });

        user.earnings -= amount;

        const gross_value = amount * 0.05;
        const net_value = gross_value * 0.90;
        user.earnings_withdrawn = (user.earnings_withdrawn || 0) + net_value;

        await user.save();

        await PurchaseRecord.create({
            id: Date.now().toString(),
            userId: user.id,
            amount: -amount,
            type: 'withdrawal',
            timestamp: new Date().toISOString(),
            status: 'completed',
            description: 'Withdrawal to bank account'
        });

        res.json({ success: true, user: standardizeUserResponse(user) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/earnings/method/set/:id', async (req, res) => {
    const user = await import('../models').then(m => m.User).then(U => U.findOneAndUpdate(
        { id: req.params.id },
        { withdrawal_method: { method: req.body.method, details: req.body.details } },
        { new: true }
    ));
    res.json({ success: !!user, user: standardizeUserResponse(user) || {} as any });
});

export default router;
