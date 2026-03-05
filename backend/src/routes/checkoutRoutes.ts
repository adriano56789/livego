import express from 'express';
import { Order } from '../models';

const router = express.Router();

const diamondPackages = [
    { id: 'pack1', diamonds: 100, price: 5.00, bonus: 0, icon: 'gem' },
    { id: 'pack2', diamonds: 500, price: 25.00, bonus: 50, icon: 'gem_stack' },
    { id: 'pack3', diamonds: 1000, price: 50.00, bonus: 150, icon: 'chest' }
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
