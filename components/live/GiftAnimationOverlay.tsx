import React, { useEffect } from 'react';
import { Gift, User } from '../../types';

export interface GiftPayload {
    fromUser: User;
    toUser: { id: string; name: string; };
    gift: Gift;
    quantity: number;
    roomId: string;
    id?: number; // Add optional id for keying
}

interface GiftAnimationOverlayProps {
    giftPayload: GiftPayload & { id: number };
    onAnimationEnd: (id: number) => void;
}

const GiftAnimationOverlay: React.FC<GiftAnimationOverlayProps> = ({ giftPayload, onAnimationEnd }) => {

    useEffect(() => {
        // The CSS animation `gift-animation-base` now lasts 5s.
        const timer = setTimeout(() => {
            onAnimationEnd(giftPayload.id);
        }, 5000);

        return () => clearTimeout(timer);

    }, [giftPayload.id, onAnimationEnd]);
    
    const { fromUser, toUser, gift, quantity } = giftPayload;

    return (
        <div className="gift-animation-base p-2 bg-black/50 rounded-full inline-flex items-center space-x-3 shadow-lg backdrop-blur-md mt-2">
            <img src={fromUser.avatarUrl} alt={fromUser.name} className="w-10 h-10 rounded-full border-2 border-purple-400" />
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

export default GiftAnimationOverlay;