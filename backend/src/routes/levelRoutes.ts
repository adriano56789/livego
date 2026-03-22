import express from 'express';
import { UserLevel } from '../models/UserLevel';
import { User } from '../models/User';

const router = express.Router();

// GET /api/level/:userId - Obter informações do nível
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let userLevel = await UserLevel.findOne({ userId });
    
    // Se não existir, criar com valores iniciais
    if (!userLevel) {
      userLevel = new UserLevel({
        userId,
        currentLevel: 1,
        currentExp: 0,
        expForNextLevel: 100,
        totalExp: 0,
        levelHistory: [{
          level: 1,
          reachedAt: new Date(),
          expRequired: 100
        }]
      });
      await userLevel.save();
    }
    
    const levelInfo = (userLevel as any).getLevelInfo();
    
    res.json({
      success: true,
      data: levelInfo
    });
  } catch (error) {
    console.error('Erro ao obter nível do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter informações do nível'
    });
  }
});

// POST /api/level/:userId/add-exp - Adicionar EXP ao usuário
router.post('/:userId/add-exp', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade de EXP inválida'
      });
    }
    
    let userLevel = await UserLevel.findOne({ userId });
    
    if (!userLevel) {
      userLevel = new UserLevel({
        userId,
        currentLevel: 1,
        currentExp: 0,
        expForNextLevel: 100,
        totalExp: 0
      });
    }
    
    const result = await (userLevel as any).addExp(amount, reason || 'EXP ganho');
    
    // Atualizar o nível no usuário principal também
    await User.findByIdAndUpdate(userId, { 
      level: result.currentLevel 
    });
    
    // Emitir evento WebSocket se disponível
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('level_updated', {
        userId,
        ...result,
        timestamp: new Date()
      });
      
      if (result.leveledUp) {
        io.to(userId).emit('level_up', {
          userId,
          newLevel: result.currentLevel,
          newLevels: result.newLevels,
          timestamp: new Date()
        });
      }
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao adicionar EXP:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar EXP'
    });
  }
});

// POST /api/level/:userId/multi-add - Adicionar EXP múltiplas vezes (batch)
router.post('/:userId/multi-add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { expGains } = req.body; // Array de { amount, reason }
    
    if (!Array.isArray(expGains) || expGains.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'expGains deve ser um array válido'
      });
    }
    
    let userLevel = await UserLevel.findOne({ userId });
    
    if (!userLevel) {
      userLevel = new UserLevel({
        userId,
        currentLevel: 1,
        currentExp: 0,
        expForNextLevel: 100,
        totalExp: 0
      });
    }
    
    let totalGained = 0;
    let allLevelUps = [];
    let finalResult = null;
    
    // Processar cada ganho de EXP
    for (const gain of expGains) {
      if (gain.amount > 0) {
        const result = await (userLevel as any).addExp(gain.amount, gain.reason || 'EXP ganho');
        totalGained += gain.amount;
        
        if (result.leveledUp) {
          allLevelUps.push(...result.newLevels);
        }
        
        finalResult = result;
      }
    }
    
    // Atualizar o nível no usuário principal
    if (finalResult) {
      await User.findByIdAndUpdate(userId, { 
        level: finalResult.currentLevel 
      });
    }
    
    // Emitir eventos WebSocket
    const io = req.app.get('io');
    if (io && finalResult) {
      io.to(userId).emit('level_updated', {
        userId,
        ...finalResult,
        timestamp: new Date()
      });
      
      if (allLevelUps.length > 0) {
        io.to(userId).emit('level_up', {
          userId,
          newLevel: finalResult.currentLevel,
          newLevels: allLevelUps,
          timestamp: new Date()
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        ...finalResult,
        totalGained,
        levelUps: allLevelUps
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar EXP múltipla:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar EXP múltipla'
    });
  }
});

// GET /api/leaderboard - Ranking de usuários por nível/EXP
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const leaderboard = await UserLevel.find()
      .sort({ totalExp: -1, currentLevel: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .populate('userId', 'name identification avatarUrl')
      .lean();
    
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1 + parseInt(offset as string),
      user: entry.userId,
      level: entry.currentLevel,
      totalExp: entry.totalExp,
      currentExp: entry.currentExp,
      expForNextLevel: entry.expForNextLevel,
      progress: (entry.currentExp / entry.expForNextLevel) * 100,
      rankTitle: entry.currentLevel >= 50 ? 'Mestre' : 
               entry.currentLevel >= 20 ? 'Avançado' : 
               entry.currentLevel >= 10 ? 'Experiente' : 'Iniciante'
    }));
    
    res.json({
      success: true,
      data: formattedLeaderboard
    });
  } catch (error) {
    console.error('Erro ao obter ranking:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter ranking'
    });
  }
});

// GET /api/level/calculate/:level - Calcular EXP necessária para um nível
router.get('/calculate/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const targetLevel = parseInt(level);
    
    if (targetLevel <= 0 || targetLevel > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Nível deve estar entre 1 e 1000'
      });
    }
    
    const expRequired = (UserLevel as any).calculateExpForLevel(targetLevel);
    
    // Calcular EXP total necessária para chegar até este nível
    let totalExpNeeded = 0;
    for (let i = 1; i < targetLevel; i++) {
      totalExpNeeded += (UserLevel as any).calculateExpForLevel(i);
    }
    
    res.json({
      success: true,
      data: {
        level: targetLevel,
        expForLevel: expRequired,
        totalExpNeeded: totalExpNeeded,
        difficulty: targetLevel <= 10 ? 'Fácil' : 
                   targetLevel <= 30 ? 'Médio' : 
                   targetLevel <= 60 ? 'Difícil' : 'Extremo'
      }
    });
  } catch (error) {
    console.error('Erro ao calcular EXP:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao calcular EXP'
    });
  }
});

export default router;
