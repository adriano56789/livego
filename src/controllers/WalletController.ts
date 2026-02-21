
import { db, saveDb, CURRENT_USER_ID } from '../services/database';
import { PurchaseRecord, Order } from '../types';
import { webSocketServerInstance } from '../services/websocket';

const truncateBRL = (value: number) => Math.floor(value * 100) / 100;
const calculateGrossBRL = (diamonds: number) => diamonds * 0.01;

export const WalletController = {
  async getEarningsInfo(req: any, res: any) {
    const { userId } = req.params;
    const user = db.users.get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const available_diamonds = user.earnings;
    const gross_brl = truncateBRL(calculateGrossBRL(available_diamonds));
    const platform_fee = truncateBRL(gross_brl * 0.20);
    const net_brl = truncateBRL(gross_brl - platform_fee);

    return res.status(200).json({
        available_diamonds,
        gross_brl,
        platform_fee_brl: platform_fee,
        net_brl
    });
  },

  async calculateWithdrawal(req: any, res: any) {
      const { amount } = req.body;
      const gross = calculateGrossBRL(amount);
      const fee = truncateBRL(gross * 0.20);
      const net = truncateBRL(gross - fee);
      return res.status(200).json({ gross_value: truncateBRL(gross), platform_fee: fee, net_value: net });
  },

  async withdrawEarnings(req: any, res: any) {
      const { userId } = req.params;
      const { amount } = req.body;
      const user = db.users.get(userId);

      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.withdrawal_method) return res.status(400).json({ error: "Method not configured" });
      if (user.earnings < amount) return res.status(400).json({ error: "Insufficient funds" });

      const gross = calculateGrossBRL(amount);
      const fee = truncateBRL(gross * 0.20);
      const net = truncateBRL(gross - fee);

      user.earnings -= amount;
      user.earnings_withdrawn = (user.earnings_withdrawn || 0) + amount;
      db.platform_earnings = truncateBRL((db.platform_earnings || 0) + fee);

      const userRecord: PurchaseRecord = {
          id: `wd_${Date.now()}`,
          userId: user.id,
          type: 'withdraw_earnings',
          description: `Saque para ${user.withdrawal_method.method}`,
          amountBRL: net,
          amountCoins: amount,
          status: 'Concluído',
          timestamp: new Date().toISOString()
      };
      db.purchases.unshift(userRecord);

      const adminRecord: PurchaseRecord = {
          id: `fee_${Date.now()}`,
          userId: 'admin', 
          type: 'platform_fee_income',
          description: `Taxa de saque de ${user.name}`,
          amountBRL: fee,
          amountCoins: 0,
          status: 'Concluído',
          timestamp: new Date().toISOString()
      };
      db.purchases.unshift(adminRecord);

      saveDb();
      
      const adminUser = db.users.get(CURRENT_USER_ID); 
      if (adminUser) { 
          adminUser.platformEarnings = db.platform_earnings;
          webSocketServerInstance.broadcastUserUpdate(adminUser);
      }
      
      webSocketServerInstance.broadcastUserUpdate(user);
      webSocketServerInstance.broadcastTransactionUpdate(userRecord);

      return res.status(200).json({ success: true, user });
  },

  async createOrder(req: any, res: any) {
      const { userId, packageId, amount, diamonds } = req.body;
      const newOrder: Order = {
          id: `ord_${Date.now()}`,
          userId,
          packageId,
          amount,
          diamonds,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };
      db.orders.set(newOrder.id, newOrder);
      saveDb();
      return res.status(201).json(newOrder);
  },

  async confirmPurchase(req: any, res: any) {
      const { orderId } = req.body;
      const order = db.orders.get(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      if (order.status === 'paid') return res.status(200).json({ success: true, message: "Already paid", order });

      const user = db.users.get(order.userId);
      if (user) {
          user.diamonds += order.diamonds;
          
          const record: PurchaseRecord = {
              id: `pur_${Date.now()}`,
              userId: user.id,
              type: 'purchase_diamonds',
              description: `Compra de ${order.diamonds} diamantes`,
              amountBRL: order.amount,
              amountCoins: order.diamonds,
              status: 'Concluído',
              timestamp: new Date().toISOString()
          };
          db.purchases.unshift(record);

          order.status = 'paid';
          order.updatedAt = new Date().toISOString();
          db.orders.set(orderId, order);
          
          saveDb();
          webSocketServerInstance.broadcastUserUpdate(user);
          webSocketServerInstance.broadcastTransactionUpdate(record);

          return res.status(200).json({ success: true, user, order });
      }
      return res.status(404).json({ error: "User not found" });
  },

  async buyDiamonds(req: any, res: any) {
      const { id } = req.params;
      const { amount, price } = req.body;
      const user = db.users.get(id);

      if (user) {
          user.diamonds += amount;
          const purchaseRecord: PurchaseRecord = {
            id: `purchase_${Date.now()}`,
            userId: user.id,
            type: 'purchase_diamonds',
            description: `Compra de ${amount} diamantes`,
            amountBRL: price,
            amountCoins: amount,
            status: 'Concluído',
            timestamp: new Date().toISOString()
          };
          db.purchases.unshift(purchaseRecord);
          saveDb();
          webSocketServerInstance.broadcastUserUpdate(user);
          webSocketServerInstance.broadcastTransactionUpdate(purchaseRecord);
          return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
  },
  
  async getHistory(req: any, res: any) {
      const { userId } = req.params;
      const history = db.purchases.filter(p => p.userId === userId)
         .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return res.status(200).json(history);
  }
};
