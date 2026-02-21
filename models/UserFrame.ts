
import mongoose, { Schema, Document } from 'mongoose';

export interface IUserFrame extends Document {
  userId: mongoose.Types.ObjectId; // Dono do frame
  frameId: string; // ID de referência do catálogo (ex: 'blazing-sun')
  
  // Mapeamento direto para os componentes React solicitados
  componentName: string; // Ex: 'FrameBlazingSunIcon', 'FrameBlueCrystalIcon'
  
  isEquipped: boolean; // Se está atualmente em uso
  isPermanent: boolean; // Se é vitalício
  
  obtainedAt: Date;
  expiresAt?: Date; // Data de expiração (se não for permanente)
  
  // Metadados de estado para animações do componente
  animationState?: {
    glowIntensity?: number;
    speed?: number;
    customColor?: string;
  };

  isActive: boolean; // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

const UserFrameSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  frameId: { type: String, required: true, index: true },
  
  componentName: { 
    type: String, 
    required: true,
    enum: [
      'FrameBlazingSunIcon',
      'FrameBlueCrystalIcon',
      'FrameGoldenFloralIcon',
      'FrameBlueFireIcon',
      'FrameDiamondIcon',
      'FrameFloralWreathIcon',
      'FrameIcyWingsIcon',
      'FrameMagentaWingsIcon',
      'FrameNeonDiamondIcon',
      'FrameNeonPinkIcon',
      'FrameOrnateBronzeIcon',
      'FramePinkGemIcon',
      'FramePinkLaceIcon',
      'FramePurpleFloralIcon',
      'FrameRegalPurpleIcon',
      'FrameSilverThornIcon',
      'FrameRoseHeartIcon',
      'FrameSilverBeadedIcon'
    ]
  },
  
  isEquipped: { type: Boolean, default: false },
  isPermanent: { type: Boolean, default: false },
  
  obtainedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: true }, // Indexado para jobs de expiração automática
  
  animationState: {
    glowIntensity: { type: Number, default: 1.0 },
    speed: { type: Number, default: 1.0 },
    customColor: { type: String }
  },

  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Garante que um usuário só pode ter um frame equipado por vez
// Nota: A lógica de negócio deve desmarcar outros frames ao equipar um novo.
// O índice abaixo ajuda a buscar rapidamente o frame equipado do usuário.
UserFrameSchema.index({ userId: 1, isEquipped: 1 });

// Garante busca rápida por validade
UserFrameSchema.index({ userId: 1, expiresAt: 1 });

export default mongoose.models.UserFrame || mongoose.model<IUserFrame>('UserFrame', UserFrameSchema);
