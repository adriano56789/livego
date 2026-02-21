
import mongoose, { Schema, Document } from 'mongoose';

// Este modelo armazena configurações globais visuais para cada componente React de Frame.
// Permite ajustar a aparência (ex: cores de gradiente SVG) sem redeploy do frontend.
export interface IFrameMetadata extends Document {
  componentName: string; // Ex: 'FrameBlazingSunIcon'
  
  visualConfig: {
    primaryColor: string;    // Ex: '#F59E0B' para BlazingSun
    secondaryColor: string;  // Ex: '#B45309'
    accentColor?: string;    // Cor de detalhes (joias, brilhos)
    strokeWidth: number;
    hasParticles: boolean;   // Se deve renderizar partículas adicionais no frontend
  };

  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  tags: string[]; // Ex: ['fire', 'gold', 'nature']
  
  createdAt: Date;
  updatedAt: Date;
}

const FrameMetadataSchema: Schema = new Schema({
  componentName: { 
    type: String, 
    required: true, 
    unique: true,
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
  
  visualConfig: {
    primaryColor: { type: String, required: true },
    secondaryColor: { type: String, required: true },
    accentColor: String,
    strokeWidth: { type: Number, default: 2 },
    hasParticles: { type: Boolean, default: false }
  },

  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary', 'mythic'], 
    default: 'common',
    index: true
  },
  
  tags: [{ type: String, index: true }]
}, {
  timestamps: true
});

export default mongoose.models.FrameMetadata || mongoose.model<IFrameMetadata>('FrameMetadata', FrameMetadataSchema);
