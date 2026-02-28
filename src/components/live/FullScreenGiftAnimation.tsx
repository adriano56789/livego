
import React, { useRef, useEffect } from 'react';
import { GiftPayload } from './GiftAnimationOverlay';
import { Gift } from '../../types';
import GiftEffectCanvas from './GiftEffectCanvas';

// Helper para classes de animação CSS
const getAnimationClass = (gift: Gift): string => {
    const nameMap: Record<string, string> = {
        'Foguete': 'gift-anim-foguete',
        'Jato Privado': 'gift-anim-jato-privado',
        'Anel': 'gift-anim-anel',
        'Leão': 'gift-anim-leao',
        'Carro': 'gift-anim-carro',
        'Carro Esportivo': 'gift-anim-carro',
        'Fênix': 'gift-anim-fenix',
        'Supercarro': 'gift-anim-supercarro',
        'Dragão': 'gift-anim-dragao',
        'Castelo': 'gift-anim-castelo',
        'Universo': 'gift-anim-universo',
        'Helicóptero': 'gift-anim-helicoptero',
        'Planeta': 'gift-anim-planeta',
        'Iate': 'gift-anim-iate',
        'Galáxia': 'gift-anim-galaxia',
        'Coroa Real': 'gift-anim-coroa-real',
        'Diamante VIP': 'gift-anim-diamante-vip',
        'Ilha Particular': 'gift-anim-ilha-particular',
        'Cavalo Alado': 'gift-anim-cavalo-alado',
        'Tigre Dourado': 'gift-anim-tigre-dourado',
        'Nave Espacial': 'gift-anim-nave-espacial',
        'Coração': 'gift-anim-coracao',
        'Café': 'gift-anim-cafe'
    };
    
    if (nameMap[gift.name]) {
        return nameMap[gift.name];
    }
    // Animação padrão "Pop Shake Glow" para presentes menores
    return 'gift-anim-pop-shake-glow';
};

const getSoundUrl = (giftName: string): string => {
    const defaultSound = "https://cdn.pixabay.com/audio/2022/10/28/audio_83a2162234.mp3";
    const soundMap: Record<string, string> = {
        'Coração': 'https://cdn.pixabay.com/audio/2022/02/07/audio_a857ac3263.mp3',
        'Café': 'https://cdn.pixabay.com/audio/2022/03/15/audio_2b4b521f7c.mp3',
        'Diamante VIP': 'https://cdn.pixabay.com/audio/2022/03/22/audio_1f289d02b8.mp3',
        'Foguete': 'https://cdn.pixabay.com/audio/2022/08/03/audio_a54b33c375.mp3',
        'Carro Esportivo': 'https://cdn.pixabay.com/audio/2023/05/27/audio_a1a0a5b8a5.mp3',
        'Leão': 'https://cdn.pixabay.com/audio/2024/02/09/audio_269c3a32f6.mp3',
    };
    return soundMap[giftName] || defaultSound;
};

const FullScreenGiftAnimation: React.FC<{ payload: GiftPayload | null; onEnd: () => void; }> = ({ payload, onEnd }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const animationTimeoutRef = useRef<number | null>(null);

    // Efeito para iniciar som e timer de encerramento
    useEffect(() => {
        const cleanup = () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        };
        cleanup();

        if (!payload || !payload.gift) {
            return;
        }

        const { gift } = payload;
        
        // Tocar som
        const audio = new Audio(getSoundUrl(gift.name));
        audio.volume = 0.5;
        audio.play().catch(e => console.error("Erro áudio:", e));

        // Determinar duração
        let duration = 3500; // Padrão

        if (gift.videoUrl) {
            const video = videoRef.current;
            if (video) {
                video.currentTime = 0;
                video.play().catch(() => onEnd());
            }
            // Fallback safety timer para vídeo
            duration = 8000;
        } else {
            // Ajustar duração baseado na animação CSS
            const animationClass = getAnimationClass(gift);
            if (animationClass.includes('iate') || animationClass.includes('cavalo')) duration = 6000;
        }

        animationTimeoutRef.current = window.setTimeout(() => {
            onEnd();
        }, duration);

        return cleanup;
    }, [payload, onEnd]);

    const handleVideoEnd = () => {
        // Pequeno delay após vídeo terminar para suavizar a saída
        setTimeout(() => onEnd(), 300);
    };

    if (!payload || !payload.gift) return null;
    
    const { gift } = payload;
    const animationClass = gift.videoUrl ? '' : getAnimationClass(gift);
    
    // CHAVE CRÍTICA: Combinação de ID e timestamp força o React a remontar o DOM completamente.
    // Isso garante que o Canvas inicie do zero e as animações CSS reiniciem.
    const uniqueKey = payload.id ? `gift-fs-${payload.id}` : `gift-fs-${Date.now()}`;
    const wrapperClass = gift.name === 'Iate' ? 'gift-anim-iate-wrapper' : '';

    return (
        <div 
            key={uniqueKey} 
            className={`fixed inset-0 z-[9990] flex flex-col items-center justify-center pointer-events-none ${wrapperClass}`}
        >
            {/* 1. Canvas de Partículas (Sempre renderizado para brilho) */}
            <GiftEffectCanvas key={`canvas-${uniqueKey}`} gift={gift} />

            {/* 2. Conteúdo Central (Vídeo ou Ícone Animado) */}
            {gift.videoUrl ? (
                <video
                    ref={videoRef}
                    key={`video-${uniqueKey}`}
                    src={gift.videoUrl}
                    autoPlay
                    muted={false} 
                    playsInline
                    onEnded={handleVideoEnd}
                    onError={handleVideoEnd}
                    className="max-w-full max-h-full object-contain relative z-10"
                    style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))' }}
                />
            ) : (
                <div className="flex flex-col items-center justify-center relative z-10">
                    {/* Glow de fundo para destacar o ícone */}
                    <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                    
                    <div className={`${animationClass} ${gift.name === 'Iate' ? 'w-48 h-48' : ''}`}>
                        {gift.component ? (
                             React.cloneElement(gift.component as React.ReactElement<any>, { className: "w-64 h-64 drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]" })
                        ) : (
                             <span className="text-[10rem] filter drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] transform scale-110 block">
                                {gift.icon}
                             </span>
                        )}
                    </div>
                    
                    {/* Texto do Presente */}
                    <div className="mt-12 text-center animate-bounce">
                        <span 
                            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] uppercase italic tracking-wider" 
                            style={{ WebkitTextStroke: '1px #b45309' }}
                        >
                            {gift.name.toUpperCase()}!
                        </span>
                    </div>
                </div>
            )}
            
            {/* CSS Global para Animação Padrão */}
            <style>{`
                @keyframes pop-shake-glow {
                    0% { transform: scale(0) rotate(0deg); opacity: 0; filter: brightness(1); }
                    20% { transform: scale(1.5) rotate(-5deg); opacity: 1; filter: brightness(1.5) drop-shadow(0 0 30px gold); }
                    30% { transform: scale(1.2) rotate(5deg); }
                    40% { transform: scale(1.4) rotate(-5deg); }
                    50% { transform: scale(1.2) rotate(5deg); filter: brightness(1.2); }
                    60% { transform: scale(1.3) rotate(0deg); }
                    80% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(2); filter: blur(20px); }
                }
                .gift-anim-pop-shake-glow {
                    animation: pop-shake-glow 3.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default FullScreenGiftAnimation;
