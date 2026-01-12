import * as FrameIcons from '@/components/icons/frames';

export const CURRENT_USER_ID = 'me';

export const getRemainingDays = (expirationDate?: string | null) => 0;

export const getFrameGlowClass = (frameId?: string | null) => {
    if (!frameId) return '';
    return 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]';
};

export const avatarFrames = [
    { id: 'FrameBlazingSun', name: 'Sol Escaldante', price: 500, duration: 30, component: FrameIcons.FrameBlazingSunIcon },
    { id: 'FrameBlueCrystal', name: 'Cristal Azul', price: 300, duration: 30, component: FrameIcons.FrameBlueCrystalIcon },
    { id: 'FrameBlueFire', name: 'Fogo Azul', price: 600, duration: 30, component: FrameIcons.FrameBlueFireIcon },
    { id: 'FrameDiamond', name: 'Diamante', price: 1000, duration: 30, component: FrameIcons.FrameDiamondIcon },
    { id: 'FrameFloralWreath', name: 'Coroa Floral', price: 400, duration: 30, component: FrameIcons.FrameFloralWreathIcon },
    { id: 'FrameGoldenFloral', name: 'Floral Dourado', price: 800, duration: 30, component: FrameIcons.FrameGoldenFloralIcon },
    { id: 'FrameIcyWings', name: 'Asas de Gelo', price: 1200, duration: 30, component: FrameIcons.FrameIcyWingsIcon },
    { id: 'FrameMagentaWings', name: 'Asas Magenta', price: 1100, duration: 30, component: FrameIcons.FrameMagentaWingsIcon },
    { id: 'FrameNeonDiamond', name: 'Diamante Neon', price: 1500, duration: 30, component: FrameIcons.FrameNeonDiamondIcon },
    { id: 'FrameNeonPink', name: 'Neon Rosa', price: 750, duration: 30, component: FrameIcons.FrameNeonPinkIcon },
    { id: 'FrameOrnateBronze', name: 'Bronze Ornate', price: 250, duration: 30, component: FrameIcons.FrameOrnateBronzeIcon },
    { id: 'FramePinkGem', name: 'Gema Rosa', price: 900, duration: 30, component: FrameIcons.FramePinkGemIcon },
    { id: 'FramePinkLace', name: 'Renda Rosa', price: 350, duration: 30, component: FrameIcons.FramePinkLaceIcon },
    { id: 'FramePurpleFloral', name: 'Floral Roxo', price: 650, duration: 30, component: FrameIcons.FramePurpleFloralIcon },
    { id: 'FrameRegalPurple', name: 'Roxo Real', price: 2000, duration: 30, component: FrameIcons.FrameRegalPurpleIcon },
    { id: 'FrameRoseHeart', name: 'Coração de Rosa', price: 1800, duration: 30, component: FrameIcons.FrameRoseHeartIcon },
    { id: 'FrameSilverBeaded', name: 'Prata Frisado', price: 200, duration: 30, component: FrameIcons.FrameSilverBeadedIcon },
    { id: 'FrameSilverThorn', name: 'Espinho de Prata', price: 450, duration: 30, component: FrameIcons.FrameSilverThornIcon }
];

export const db_frontend_stub = {
    liveSessions: new Map<string, any>()
};