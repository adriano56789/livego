
import React, { useRef, useEffect } from 'react';
import { GiftPayload } from './GiftAnimationOverlay';
import { Gift } from '../../types';

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
    // For all other "minor" gifts, use a generic fullscreen animation
    return 'gift-anim-fullscreen-generic';
};

const getSoundUrl = (giftName: string): string => {
    const soundMap: Record<string, string> = {
        // Simple, magical sounds
        'Coração': 'https://cdn.pixabay.com/audio/2022/02/07/audio_a857ac3263.mp3',
        'Café': 'https://cdn.pixabay.com/audio/2022/03/15/audio_2b4b521f7c.mp3',
        'Flor': 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb6323c130.mp3',
        'Rosa': 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb6323c130.mp3',
        'Anel': 'https://cdn.pixabay.com/audio/2022/03/22/audio_1f289d02b8.mp3',
        'Diamante VIP': 'https://cdn.pixabay.com/audio/2022/03/22/audio_1f289d02b8.mp3',

        // Transportation
        'Foguete': 'https://cdn.pixabay.com/audio/2022/08/03/audio_a54b33c375.mp3',
        'Jato Privado': 'https://cdn.pixabay.com/audio/2023/04/05/audio_458896a75f.mp3',
        'Carro Esportivo': 'https://cdn.pixabay.com/audio/2023/05/27/audio_a1a0a5b8a5.mp3',
        'Carro': 'https://cdn.pixabay.com/audio/2022/03/15/audio_731154563a.mp3',
        'Supercarro': 'https://cdn.pixabay.com/audio/2023/05/27/audio_a1a0a5b8a5.mp3',
        'Helicóptero': 'https://cdn.pixabay.com/audio/2022/07/21/audio_1d21b0c96c.mp3',
        'Iate': 'https://cdn.pixabay.com/audio/2023/09/17/audio_651a5e554d.mp3',
        'Nave Espacial': 'https://cdn.pixabay.com/audio/2022/11/22/audio_1e3b28b6d4.mp3',
        
        // Animals
        'Leão': 'https://cdn.pixabay.com/audio/2024/02/09/audio_269c3a32f6.mp3',
        'Fênix': 'https://cdn.pixabay.com/audio/2022/09/20/audio_510a562089.mp3',
        'Dragão': 'https://cdn.pixabay.com/audio/2022/09/20/audio_510a562089.mp3',
        'Cavalo Alado': 'https://cdn.pixabay.com/audio/2022/03/10/audio_1e9261a993.mp3',
        'Tigre Dourado': 'https://cdn.pixabay.com/audio/2024/02/09/audio_269c3a32f6.mp3',

        // Grand / Epic
        'Castelo': 'https://cdn.pixabay.com/audio/2022/09/20/audio_510a562089.mp3',
        'Ilha Particular': 'https://cdn.pixabay.com/audio/2022/08/17/audio_b724128f64.mp3',
        'Coroa Real': 'https://cdn.pixabay.com/audio/2022/09/20/audio_510a562089.mp3',
        
        // Sci-Fi / Cosmic
        'Universo': 'https://cdn.pixabay.com/audio/2022/03/22/audio_39d5738a53.mp3',
        'Galáxia': 'https://cdn.pixabay.com/audio/2022/03/22/audio_39d5738a53.mp3',
        'Planeta': 'https://cdn.pixabay.com/audio/2022/03/22/audio_39d5738a53.mp3',
    };
    // Default sound for gifts without a specific one
    return soundMap[giftName] || "https://cdn.pixabay.com/audio/2022/10/28/audio_83a2162234.mp3";
};


const FullScreenGiftAnimation: React.FC<{ payload: GiftPayload | null; onEnd: () => void; }> = ({ payload, onEnd }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const animationTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const cleanup = () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        };
        cleanup();

        if (!payload || !payload.gift || !payload.gift.name) {
            if (payload) { // If payload exists but gift is invalid, end immediately
                onEnd();
            }
            return;
        }

        const { gift } = payload;
        
        const audio = new Audio(getSoundUrl(gift.name));
        audio.play().catch(e => console.error("Falha na reprodução de áudio:", e));

        if (gift.videoUrl) {
            const video = videoRef.current;
            if (video) {
                video.currentTime = 0;
                video.play().catch(() => onEnd()); // if video fails to play, end animation immediately
            }
            return; // Video has its own onEnded handler
        }

        // Handle CSS animations
        const animationClass = getAnimationClass(gift);
        let duration = 3000; // Default duration
        
        // Map animation class to its duration in ms for the timeout
        const durationMap: Record<string, number> = {
            'gift-anim-coracao': 1500,
            'gift-anim-supercarro': 1500,
            'gift-anim-leao': 2000,
            'gift-anim-castelo': 2000,
            'gift-anim-coroa-real': 2000,
            'gift-anim-carro': 2500,
            'gift-anim-foguete': 3000,
            'gift-anim-cafe': 3000,
            'gift-anim-anel': 3000,
            'gift-anim-fenix': 3000,
            'gift-anim-diamante-vip': 3000,
            'gift-anim-ilha-particular': 3000,
            'gift-anim-jato-privado': 4000,
            'gift-anim-dragao': 4000,
            'gift-anim-helicoptero': 4000,
            'gift-anim-galaxia': 4000,
            'gift-anim-cavalo-alado': 5000,
            'gift-anim-tigre-dourado': 5000,
            'gift-anim-iate': 6000,
            'gift-anim-fullscreen-generic': 3000, // Duration for the generic animation
        };

        if (durationMap[animationClass]) {
            duration = durationMap[animationClass];
        }

        animationTimeoutRef.current = window.setTimeout(() => {
            onEnd();
        }, duration);

        return cleanup;
    }, [payload, onEnd]);

    const handleVideoEnd = () => {
        onEnd();
    };

    if (!payload || !payload.gift || !payload.gift.name) {
        return null;
    }
    
    const { gift } = payload;
    const animationClass = gift.videoUrl ? '' : getAnimationClass(gift);
    const wrapperClass = gift.name === 'Iate' ? 'gift-anim-iate-wrapper absolute inset-0' : '';

    return (
        <div className={`absolute inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none ${wrapperClass}`}>
            {gift.videoUrl ? (
                <video
                    ref={videoRef}
                    key={payload.fromUser.id + payload.gift.name + Date.now()}
                    src={gift.videoUrl}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnd}
                    onError={handleVideoEnd}
                    className="max-w-full max-h-full object-contain"
                />
            ) : (
                <div className={`flex items-center justify-center ${gift.name === 'Iate' ? 'w-48 h-48' : ''}`}>
                    <div className={animationClass}>
                        {gift.component ? React.cloneElement(gift.component, { className: "w-48 h-48" }) : <span className="text-8xl">{gift.icon}</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FullScreenGiftAnimation;
