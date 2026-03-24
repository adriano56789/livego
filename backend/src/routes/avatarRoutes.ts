import express from 'express';
import { User, PurchaseRecord } from '../models';

const router = express.Router();

// GET /users/:id/frames - Retorna os frames do usuário
router.get('/users/:id/frames', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ id });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Filtrar frames que não expiraram
    const now = new Date();
    const activeFrames = (user.ownedFrames || []).filter((frame: any) => {
      const expirationDate = new Date(frame.expirationDate);
      return expirationDate > now;
    });

    res.json({
      ownedFrames: activeFrames,
      activeFrameId: user.activeFrameId,
      diamonds: user.diamonds
    });
  } catch (error: any) {
    console.error('Erro ao buscar frames do usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /users/:id/frames/buy - Compra um frame
router.post('/users/:id/frames/buy', async (req, res) => {
  try {
    const { id } = req.params;
    const { frameId, price, duration } = req.body;

    if (!frameId || !price || !duration) {
      return res.status(400).json({ error: 'frameId, price e duration são obrigatórios' });
    }

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se usuário tem diamonds suficientes
    if (user.diamonds < price) {
      return res.status(400).json({ error: 'Diamonds insuficientes' });
    }

    // Verificar se já possui este frame
    const existingFrame = (user.ownedFrames || []).find((f: any) => f.frameId === frameId);
    if (existingFrame) {
      return res.status(400).json({ error: 'Você já possui este frame' });
    }

    // Adicionar frame ao usuário
    const expirationDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    
    if (!user.ownedFrames) {
      user.ownedFrames = [];
    }
    
    user.ownedFrames.push({
      frameId,
      expirationDate: expirationDate.toISOString()
    });

    // Deduzir diamonds do comprador
    user.diamonds -= price;

    // Adicionar diamonds à carteira ADM (avatar é meu produto)
    const ADM_EMAIL = process.env.ADM_EMAIL || 'adrianomdk5@gmail.com';
    const admUser = await User.findOneAndUpdate(
      { email: ADM_EMAIL },
      { $inc: { earnings: price } },
      { new: true }
    );

    await user.save();

    // Registrar compra de avatar no histórico
    await PurchaseRecord.create({
      id: `avatar_${frameId}_${user.id}_${Date.now()}`,
      userId: user.id,
      type: 'avatar_purchase',
      description: `Compra de avatar/frame ${frameId} - ${price} diamantes`,
      amountBRL: 0, // Compra interna, não envolve dinheiro real
      amountCoins: price,
      status: 'Concluído',
      timestamp: new Date()
    });

    // Registrar receita para ADM
    if (admUser) {
      await PurchaseRecord.create({
        id: `avatar_fee_${frameId}_${user.id}_${Date.now()}`,
        userId: admUser.id,
        type: 'avatar_sale_income',
        description: `Venda de avatar ${frameId} para ${user.name}: ${price} diamantes`,
        amountBRL: 0,
        amountCoins: price,
        status: 'Concluído',
        timestamp: new Date()
      });
    }

    // Emitir WebSocket para atualização em tempo real
    const io = req.app.get('io');
    if (io) {
      io.to(user.id).emit('avatar_purchased', {
        userId: user.id,
        frameId,
        price,
        newDiamonds: user.diamonds
      });

      // Notificar ADM sobre nova receita
      if (admUser) {
        io.to(admUser.id).emit('earnings_updated', {
          userId: admUser.id,
          earnings: admUser.earnings,
          change: price,
          source: 'avatar_sale',
          fromUser: user.name
        });
      }
    }

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        diamonds: user.diamonds,
        ownedFrames: user.ownedFrames,
        activeFrameId: user.activeFrameId
      }
    });
  } catch (error: any) {
    console.error('Erro ao comprar frame:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /users/:id/frames/equip - Equipa um frame
router.post('/users/:id/frames/equip', async (req, res) => {
  try {
    const { id } = req.params;
    const { frameId } = req.body;

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o usuário possui este frame
    const ownedFrame = (user.ownedFrames || []).find((f: any) => f.frameId === frameId);
    if (!ownedFrame) {
      return res.status(400).json({ error: 'Você não possui este frame' });
    }

    // Verificar se o frame não expirou
    const expirationDate = new Date(ownedFrame.expirationDate);
    if (expirationDate <= new Date()) {
      return res.status(400).json({ error: 'Este frame expirou' });
    }

    // Equipar o frame
    user.activeFrameId = frameId;
    await user.save();

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        activeFrameId: user.activeFrameId,
        ownedFrames: user.ownedFrames
      }
    });
  } catch (error: any) {
    console.error('Erro ao equipar frame:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /users/:id/frames/unequip - Desequipa um frame
router.post('/users/:id/frames/unequip', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Desequipar o frame
    user.activeFrameId = null;
    await user.save();

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        activeFrameId: user.activeFrameId,
        ownedFrames: user.ownedFrames
      }
    });
  } catch (error: any) {
    console.error('Erro ao desequipar frame:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
