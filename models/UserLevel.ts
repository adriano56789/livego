import mongoose, { Schema, Document } from 'mongoose';

// Interface para o UserLevel
export interface IUserLevel extends Document {
  userId: string;
  currentLevel: number;
  currentExp: number;
  expForNextLevel: number;
  totalExp: number;
  levelHistory: Array<{
    level: number;
    reachedAt: Date;
    expRequired: number;
  }>;
  lastExpGain: {
    amount: number;
    reason: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema do MongoDB
const UserLevelSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  currentLevel: {
    type: Number,
    default: 1,
    min: 1
  },
  currentExp: {
    type: Number,
    default: 0,
    min: 0
  },
  expForNextLevel: {
    type: Number,
    default: 100 // Nível 1 requer 100 EXP
  },
  totalExp: {
    type: Number,
    default: 0,
    min: 0
  },
  levelHistory: [{
    level: {
      type: Number,
      required: true
    },
    reachedAt: {
      type: Date,
      default: Date.now
    },
    expRequired: {
      type: Number,
      required: true
    }
  }],
  lastExpGain: {
    amount: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Índices para performance
UserLevelSchema.index({ userId: 1 });
UserLevelSchema.index({ currentLevel: 1 });
UserLevelSchema.index({ totalExp: -1 });

// Método estático para calcular EXP necessária por nível
UserLevelSchema.statics.calculateExpForLevel = function(level: number): number {
  if (level <= 0) return 0;
  
  // Progressão geométrica com aumento gradual
  const baseExp = 100;
  const growthRate = 1.5;
  
  if (level <= 5) {
    // Níveis iniciais - progressão linear suave
    const progressions = [100, 200, 300, 500, 800];
    return progressions[level - 1] || baseExp;
  } else if (level <= 20) {
    // Níveis intermediários - progressão geométrica moderada
    return Math.floor(baseExp * Math.pow(growthRate, level - 1));
  } else if (level <= 50) {
    // Níveis avançados - crescimento mais acelerado
    return Math.floor(baseExp * Math.pow(growthRate * 1.2, level - 1));
  } else {
    // Níveis mestres - crescimento exponencial
    return Math.floor(baseExp * Math.pow(growthRate * 1.5, level - 1));
  }
};

// Método para adicionar EXP e verificar level up
UserLevelSchema.methods.addExp = async function(amount: number, reason: string = '') {
  this.currentExp += amount;
  this.totalExp += amount;
  this.lastExpGain = {
    amount,
    reason,
    timestamp: new Date()
  };

  let leveledUp = false;
  let newLevels = [];

  // Verificar se subiu de nível
  while (this.currentExp >= this.expForNextLevel) {
    this.currentExp -= this.expForNextLevel;
    this.currentLevel++;
    
    const newExpForNext = (this.constructor as any).calculateExpForLevel(this.currentLevel + 1);
    this.expForNextLevel = newExpForNext;
    
    // Adicionar ao histórico
    this.levelHistory.push({
      level: this.currentLevel,
      reachedAt: new Date(),
      expRequired: this.expForNextLevel
    });
    
    newLevels.push(this.currentLevel);
    leveledUp = true;
  }

  await this.save();
  
  return {
    leveledUp,
    newLevels,
    currentLevel: this.currentLevel,
    currentExp: this.currentExp,
    expForNextLevel: this.expForNextLevel,
    totalExp: this.totalExp,
    progress: (this.currentExp / this.expForNextLevel) * 100
  };
};

// Método para obter informações completas do nível
UserLevelSchema.methods.getLevelInfo = function() {
  return {
    level: this.currentLevel,
    currentExp: this.currentExp,
    expForNextLevel: this.expForNextLevel,
    totalExp: this.totalExp,
    progress: Math.min((this.currentExp / this.expForNextLevel) * 100, 100),
    expNeeded: Math.max(0, this.expForNextLevel - this.currentExp),
    lastGain: this.lastExpGain,
    levelHistory: this.levelHistory.slice(-10), // Últimos 10 níveis
    rank: this.currentLevel >= 50 ? 'Mestre' : 
           this.currentLevel >= 20 ? 'Avançado' : 
           this.currentLevel >= 10 ? 'Experiente' : 'Iniciante'
  };
};

export const UserLevel = mongoose.model<IUserLevel>('UserLevel', UserLevelSchema);
