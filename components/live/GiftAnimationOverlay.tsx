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
        <div className="gift-animation-base px-3 py-2 bg-black/50 rounded-full inline-flex items-center shadow-lg backdrop-blur-md mt-2 whitespace-nowrap overflow-hidden" style={animationStyle}>
            <img src={fromUser.avatarUrl} alt="" className="w-8 h-8 rounded-full border-2 border-purple-400 mr-2 flex-shrink-0" />
            <span className="text-white text-sm font-medium">
                <span className="font-bold">{fromUser.name}</span> enviou {gift.name} <span className="text-yellow-300">x{quantity}</span> {gift.component ? 
                    React.cloneElement(gift.component as React.ReactElement<any>, { className: "w-5 h-5 inline-block align-middle" }) : 
                    <span className="inline-block align-middle">{gift.icon}</span>}
            </span>
        </div>
    );
};

// Função de comparação para o memo
const areEqual = (prevProps: GiftAnimationOverlayProps, nextProps: GiftAnimationOverlayProps) => {
    return prevProps.giftPayload.id === nextProps.giftPayload.id;
};

export default memo(GiftAnimationOverlay, areEqual);