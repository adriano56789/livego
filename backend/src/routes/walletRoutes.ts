import express from 'express';
import { PurchaseRecord } from '../models';
import { standardizeUserResponse } from '../utils/userResponse';
import { calculateBRLFromDiamonds } from '../utils/diamondConversion';

const router = express.Router();

router.get('/purchases/history/:id', async (req, res) => {
    const history = await PurchaseRecord.find({ userId: req.params.id }).sort({ timestamp: -1 });
    res.json(history);
});
router.get('/earnings/get/:id', async (req, res) => {
    const user = await import('../models').then(m => m.User).then(U => U.findOne({ id: req.params.id }));
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Converter diamantes acumulados para BRL usando tabela específica
    const available_diamonds = user.earnings || 0;
    const brl_value = calculateBRLFromDiamonds(available_diamonds);

    res.json({ 
        available_diamonds, 
        brl_value,
        conversion_rate: 'Tabela de pacotes'
    });
});
router.post('/earnings/calculate', async (req, res) => {
    const amount = req.body.amount || 0;
    
    // Converter diamantes para BRL usando tabela específica
    const brl_amount = calculateBRLFromDiamonds(amount);
    
    // Aplicar taxa de 20% da plataforma
    const platform_fee = brl_amount * 0.20;
    const net_amount = brl_amount - platform_fee;
    
    res.json({ 
        diamonds: amount,
        gross_brl: brl_amount,
        platform_fee_brl: platform_fee,
        net_brl: net_amount,
        breakdown: {
            conversion: `${amount} diamantes = R$${brl_amount.toFixed(2)}`,
            fee: `Taxa da plataforma (20%): R$${platform_fee.toFixed(2)}`,
            final: `Valor a receber: R$${net_amount.toFixed(2)}`
        }
    });
});
router.post('/earnings/withdraw/:id', async (req, res) => {
    try {
        const amount = req.body.amount || 0;
        const user = await import('../models').then(m => m.User).then(U => U.findOne({ id: req.params.id }));
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.earnings < amount) return res.status(400).json({ error: 'Insufficient earnings' });

        // Converter diamantes para BRL usando tabela
        const brl_amount = calculateBRLFromDiamonds(amount);
        
        // Aplicar taxa de 20% da plataforma apenas no saque
        const platform_fee = brl_amount * 0.20;
        const net_amount = brl_amount - platform_fee;

        user.earnings -= amount;
        user.earnings_withdrawn = (user.earnings_withdrawn || 0) + net_amount;

        await user.save();

        await PurchaseRecord.create({
            id: Date.now().toString(),
            userId: user.id,
            amount: -amount,
            diamonds: amount,
            brl_amount: brl_amount,
            platform_fee: platform_fee,
            net_amount: net_amount,
            type: 'withdrawal',
            timestamp: new Date().toISOString(),
            status: 'completed',
            description: `Withdrawal: ${amount} diamonds = R$${brl_amount.toFixed(2)} - 20% fee = R$${net_amount.toFixed(2)}`
        });

        res.json({ 
            success: true, 
            user: standardizeUserResponse(user),
            withdrawal: {
                diamonds: amount,
                brl_amount,
                platform_fee,
                net_amount
            }
        });
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
