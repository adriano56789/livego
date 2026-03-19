import express from 'express';
import { Order, User, PurchaseRecord } from '../models';

const router = express.Router();

// Confirmar compra de diamantes
router.post('/confirm', async (req, res) => {
    try {
        const { orderId } = req.body;
        console.log(`[PURCHASE CONFIRM] Confirmando compra: ${orderId}`);
        
        const order = await Order.findOneAndUpdate({ id: orderId }, { status: 'paid' }, { new: true });
        if (!order) {
            console.log(`[PURCHASE ERROR] Order não encontrada: ${orderId}`);
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log(`[PURCHASE CONFIRM] Order encontrada:`, {
            orderId: order.id,
            userId: order.userId,
            diamonds: order.diamonds,
            amount: order.amount
        });

        const user = await User.findOneAndUpdate(
            { id: order.userId },
            { $inc: { diamonds: order.diamonds } },
            { new: true }
        );

        if (!user) {
            console.log(`[PURCHASE ERROR] Usuário não encontrado: ${order.userId}`);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[PURCHASE SUCCESS] Usuário ${user.name} recebeu ${order.diamonds} diamantes. Saldo atual: ${user.diamonds}`);

        // Registrar compra no histórico
        await PurchaseRecord.create({
            id: `purchase_${orderId}_${Date.now()}`,
            userId: order.userId,
            type: 'diamond_purchase',
            description: `Compra de ${order.diamonds} diamantes`,
            amountBRL: order.amount,
            amountCoins: order.diamonds,
            status: 'Concluído',
            timestamp: new Date()
        });

        res.json({ success: true, user, order });
    } catch (err: any) {
        console.error(`[PURCHASE ERROR] Erro ao confirmar compra:`, err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
