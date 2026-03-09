import express from 'express';
import { Order } from '../models';

const router = express.Router();

const diamondPackages = [
    { id: 'pack1', diamonds: 800, price: 7.00, bonus: 0, icon: 'gem' },
    { id: 'pack2', diamonds: 3000, price: 25.00, bonus: 0, icon: 'gem_stack' },
    { id: 'pack3', diamonds: 6000, price: 60.00, bonus: 0, icon: 'chest' },
    { id: 'pack4', diamonds: 20000, price: 180.00, bonus: 0, icon: 'treasure' },
    { id: 'pack5', diamonds: 36000, price: 350.00, bonus: 0, icon: 'crown' },
    { id: 'pack6', diamonds: 65000, price: 600.00, bonus: 0, icon: 'diamond_throne' }
];

router.get('/pack', async (req, res) => res.json(diamondPackages));
router.post('/order', async (req, res) => {
    const order = await Order.create({ ...req.body, id: Date.now().toString(), status: 'pending' });
    res.json(order);
});
router.post('/pix', async (req, res) => {
    res.json({ success: true, pixCode: 'test-pix-12345', expiration: new Date().toISOString(), orderId: req.body.orderId });
});
router.post('/credit-card', async (req, res) => {
    res.json({ success: true, message: 'Pago', orderId: req.body.orderId });
});
router.post('/confirm', async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate({ id: req.body.orderId }, { status: 'paid' }, { new: true });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const user = await import('../models').then(m => m.User).then(U => U.findOneAndUpdate(
            { id: order.userId },
            { $inc: { diamonds: order.diamonds } },
            { new: true }
        ));

        res.json({ success: !!user, user: user || {} as any, order });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
