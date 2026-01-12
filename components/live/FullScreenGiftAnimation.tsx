

import React, { useEffect, useState } from 'react';
import type { GiftSendPayload } from '../../types';

interface FullScreenGiftAnimationProps {
    payload: GiftSendPayload | null;
    onEnd: () => void;
}

export default function FullScreenGiftAnimation({ payload, onEnd }: FullScreenGiftAnimationProps) {
    const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter');

    useEffect(() => {
        if (payload) {
            setPhase('enter');
            
            // Enter animation duration
            const enterTimer = setTimeout(() => {
                setPhase('idle');
            }, 500);

            // Total duration before exit
            const exitTimer = setTimeout(() => {
                setPhase('exit');
            }, 2500);

            // Cleanup after exit
            const endTimer = setTimeout(() => {
                onEnd();
            }, 3000);

            return () => {
                clearTimeout(enterTimer);
                clearTimeout(exitTimer);
                clearTimeout(endTimer);
            };
        }
    }, [payload, onEnd]);

    if (!payload) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden">
            <style>{`
                @keyframes gift-enter {
                    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
                    50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes gift-exit {
                    0% { transform: scale(1) translateY(0); opacity: 1; }
                    100% { transform: scale(1.5) translateY(-50px); opacity: 0; }
                }
                @keyframes rays-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .gift-enter { animation: gift-enter 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .gift-exit { animation: gift-exit 0.5s ease-in forwards; }
                .rays { animation: rays-spin 10s linear infinite; }
            `}</style>

            <div className={`relative flex flex-col items-center justify-center ${phase === 'enter' ? 'gift-enter' : phase === 'exit' ? 'gift-exit' : ''}`}>
                
                {/* Background Rays/Glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[500px] h-[500px] bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 rounded-full blur-3xl opacity-50"></div>
                    {/* Rotating Rays */}
                    <div className="absolute w-[600px] h-[600px] rays opacity-30">
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/20 to-transparent w-full h-full" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/20 to-transparent w-full h-full rotate-90" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/20 to-transparent w-full h-full rotate-180" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/20 to-transparent w-full h-full rotate-270" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}></div>
                    </div>
                </div>

                {/* Gift Icon */}
                <div className="relative z-10 text-9xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform transition-transform duration-200">
                    {payload.gift.component ? payload.gift.component : payload.gift.icon}
                </div>

                {/* Text Info */}
                <div className="relative z-10 mt-8 text-center">
                    <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-2 border border-yellow-500/50 shadow-lg">
                        <p className="text-yellow-400 font-bold text-xl uppercase tracking-widest flex items-center gap-2">
                            {payload.gift.name}
                            <span className="text-white text-lg">x{payload.quantity}</span>
                        </p>
                    </div>
                    <p className="text-white/80 text-sm mt-2 font-medium bg-black/40 px-3 py-1 rounded-full inline-block">
                        Enviado por {payload.fromUser.name}
                    </p>
                </div>
            </div>
        </div>
    );
}