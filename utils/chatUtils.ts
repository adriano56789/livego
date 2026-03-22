// Front-end utilities - NO database operations
// All data should come from API
import React from 'react';

export const createChatKey = (userId1: string, userId2: string): string => {
    // Create a consistent chat key for UI purposes only
    return [userId1, userId2].sort().join('_');
};

// Avatar frame utilities - data should come from API
export interface AvatarFrame {
    id: string;
    name: string;
    price: number;
    duration: number;
    component?: React.ComponentType<any>; // React component for the frame
}

export interface OwnedFrame {
    frameId: string;
    expirationDate?: string;
}

// These should come from API calls via api.getAvatarFrames()
export const avatarFrames: AvatarFrame[] = [];

export const getRemainingDays = (expirationDate?: string): number => {
    // Sempre retorna 7 dias para padronização
    return 7;
};

export const getFrameGlowClass = (activeFrameId?: string | null): string => {
    if (!activeFrameId) return '';
    
    const frameGlowMap: Record<string, string> = {
        'vip': 'glow-vip',
        'premium': 'glow-premium',
        'legendary': 'glow-legendary',
    };
    
    return frameGlowMap[activeFrameId] || 'glow-default';
};
