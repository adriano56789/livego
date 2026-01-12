

import React, { useEffect, useState } from 'react';
import type { GiftSendPayload } from '../../types';

interface Props {
    giftPayload: GiftSendPayload;
    onAnimationEnd: (id: number) => void;
}

const GiftAnimationOverlay: React.FC<Props> = ({ giftPayload, onAnimationEnd }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                if (giftPayload.id !== undefined && giftPayload.id !== null) {
                    onAnimationEnd(giftPayload.id);
                }
            }, 400); 
        }, 2200); 

        return () => clearTimeout(timer);
    }, [giftPayload, onAnimationEnd]);

    return (
        <div 
            className={`flex items-center bg-black/60 backdrop-blur-md rounded-full pr-5 py-1.5 pl-1.5 mb-2 transition-all duration-400 ease-out border border-white/5 shadow-2xl ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 scale-95'}`}
        >
            <div className="relative">
                <img src={giftPayload.fromUser.avatarUrl} className="w-9 h-9 rounded-full border-2 border-yellow-400 object-cover" alt="" />
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                </div>
            </div>
            <div className="ml-3 mr-3">
                <p className="text-white text-[11px] font-black tracking-tight">{giftPayload.fromUser.name}</p>
                <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-tighter">Enviou {giftPayload.gift.name}</p>
            </div>
            <div className="text-3xl filter drop-shadow-md">
                {giftPayload.gift.component ? giftPayload.gift.component : giftPayload.gift.icon}
            </div>
            <div className="ml-3 text-white font-black italic text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                <span className="text-yellow-400 text-sm mr-0.5">x</span>{giftPayload.quantity}
            </div>
        </div>
    );
};

export default GiftAnimationOverlay;