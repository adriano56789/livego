import React, { useEffect, memo, useCallback } from 'react';
import { Gift, User } from '../../types';

// Estilos inline otimizados
const animationStyle: React.CSSProperties = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  perspective: '1000px',
  willChange: 'transform, opacity'
};

export interface GiftPayload {
    fromUser: User;
    toUser: { id: string; name: string; };
    gift: Gift;
    quantity: number;
    roomId: string;
    id?: number | string; // Add optional id for keying
}

interface GiftAnimationOverlayProps {
    giftPayload: GiftPayload & { id: number | string };
    onAnimationEnd: (id: number | string) => void;
}

const GiftAnimationOverlay: React.FC<GiftAnimationOverlayProps> = ({ giftPayload, onAnimationEnd }) => {

    // Usando useCallback para evitar recriação da função a cada renderização
    const handleAnimationEnd = useCallback(() => {
        onAnimationEnd(giftPayload.id);
    }, [giftPayload.id, onAnimationEnd]);

    useEffect(() => {
        // Removido o timeout para a notificação não desaparecer sozinha
        // A notificação será removida apenas quando uma nova notificação for adicionada
    }, [handleAnimationEnd]);
    
    const { fromUser, toUser, gift, quantity } = giftPayload;

    return (
        <div 
            className="gift-animation-base p-2 bg-black/50 rounded-full inline-flex items-center space-x-3 shadow-lg backdrop-blur-md mt-2"
            style={animationStyle}
        >
            <img src={fromUser.avatarUrl} alt={fromUser.name} className="w-10 h-10 rounded-full border-2 border-purple-400 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
            <div className="flex flex-col text-left">
                <p className="text-white font-bold text-sm">{fromUser.name}</p>
                <p className="text-gray-300 text-xs">enviou para {toUser.name}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center gift-anim-pulse">
                 {gift.component ? React.cloneElement(gift.component as React.ReactElement<any>, { className: "w-10 h-10" }) : <span className="text-4xl">{gift.icon}</span>}
            </div>
            <p className="text-yellow-300 font-bold text-2xl">x{quantity}</p>
        </div>
    );
};

// Função de comparação para o memo
const areEqual = (prevProps: GiftAnimationOverlayProps, nextProps: GiftAnimationOverlayProps) => {
    return prevProps.giftPayload.id === nextProps.giftPayload.id;
};

export default memo(GiftAnimationOverlay, areEqual);