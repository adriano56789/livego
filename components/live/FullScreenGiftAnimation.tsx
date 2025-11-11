import React, { useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { GiftPayload } from './GiftAnimationOverlay';
import { Gift } from '../../types';

// Mapeamento otimizado para animações
const ANIMATION_MAP: Record<string, string> = {
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

// Mapeamento otimizado para sons
const SOUND_MAP: Record<string, string> = {
  'Coração': 'https://cdn.pixabay.com/audio/2022/02/07/audio_a857ac3263.mp3',
  'Café': 'https://cdn.pixabay.com/audio/2022/03/15/audio_2b4b521f7c.mp3',
  'Flor': 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb6323c130.mp3',
  'Rosa': 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb6323c130.mp3',
  'Anel': 'https://cdn.pixabay.com/audio/2022/03/22/audio_1f289d02b8.mp3',
  'Diamante VIP': 'https://cdn.pixabay.com/audio/2022/03/22/audio_1f289d02b8.mp3',
  'Foguete': 'https://cdn.pixabay.com/audio/2022/08/03/audio_a54b33c375.mp3',
  'Jato Privado': 'https://cdn.pixabay.com/audio/2022/05/26/audio_f542521192.mp3',
  'Carro Esportivo': 'https://cdn.pixabay.com/audio/2022/04/23/audio_e8b1b22295.mp3',
  'Carro': 'https://cdn.pixabay.com/audio/2022/03/15/audio_731154563a.mp3',
  'Supercarro': 'https://cdn.pixabay.com/audio/2022/04/23/audio_e8b1b22295.mp3',
  'Helicóptero': 'https://cdn.pixabay.com/audio/2022/07/21/audio_1d21b0c96c.mp3',
  'Iate': 'https://cdn.pixabay.com/audio/2022/08/17/audio_393f64309a.mp3',
  'Nave Espacial': 'https://cdn.pixabay.com/audio/2022/11/22/audio_1e3b28b6d4.mp3',
  'Leão': 'https://cdn.pixabay.com/audio/2022/03/14/audio_34b0791444.mp3',
  'Fênix': 'https://cdn.pixabay.com/audio/2022/03/10/audio_c3b2d1316b.mp3',
  'Dragão': 'https://cdn.pixabay.com/audio/2022/03/10/audio_c3b2d1316b.mp3',
  'Cavalo Alado': 'https://cdn.pixabay.com/audio/2022/03/10/audio_c295709568.mp3',
  'Tigre Dourado': 'https://cdn.pixabay.com/audio/2022/03/14/audio_34b0791444.mp3',
  'Castelo': 'https://cdn.pixabay.com/audio/2022/03/10/audio_c3b2d1316b.mp3',
  'Ilha Particular': 'https://cdn.pixabay.com/audio/2022/08/17/audio_393f64309a.mp3',
  'Coroa Real': 'https://cdn.pixabay.com/audio/2022/03/10/audio_c3b2d1316b.mp3',
  'Universo': 'https://cdn.pixabay.com/audio/2022/01/25/audio_845236720e.mp3',
  'Galáxia': 'https://cdn.pixabay.com/audio/2022/01/25/audio_845236720e.mp3',
  'Planeta': 'https://cdn.pixabay.com/audio/2022/01/25/audio_845236720e.mp3',
};

// Função otimizada para obter a classe de animação
const getAnimationClass = (gift: Gift): string => {
  return ANIMATION_MAP[gift.name] || 'gift-anim-fullscreen-generic';
};

// Função otimizada para obter URL do som
const getSoundUrl = (giftName: string): string => {
  return SOUND_MAP[giftName] || "https://cdn.pixabay.com/audio/2022/10/28/audio_83a2162234.mp3";
};

interface FullScreenGiftAnimationProps {
  payload: GiftPayload;
  onEnd: () => void;
}

const FullScreenGiftAnimation: React.FC<FullScreenGiftAnimationProps> = ({ payload, onEnd }) => {
  // Verificação de segurança para payload nulo
  if (!payload || !payload.gift) {
    console.warn('FullScreenGiftAnimation: payload ou gift é nulo');
    return null;
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const animationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Função de limpeza
    const cleanup = () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };

    // Limpa qualquer timeout existente
    cleanup();

    if (!payload || !payload.gift || !payload.gift.name) {
      if (payload) { // Se o payload existir mas o gift for inválido, encerra imediatamente
        onEnd();
      }
      return;
    }

        const { gift } = payload;
        
        const audio = new Audio(getSoundUrl(gift.name));
        audio.onerror = (e) => {
            console.warn(`Error loading audio source for gift '${gift.name}': ${audio.src}`, e);
        };
        audio.play().catch(e => {
            if (e.name === 'NotAllowedError') {
                console.warn(`Audio autoplay for gift '${gift.name}' was prevented by the browser.`);
            } else {
                console.warn(`Could not play audio for gift '${gift.name}'. Error: ${e.message}`);
            }
        });


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

        // Retorna a função de limpeza para ser executada na desmontagem
        return () => {
          cleanup();
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
          }
        };
    }, [payload, onEnd]);

    const handleVideoEnd = useCallback(() => {
        onEnd();
    }, [onEnd]);

    // Verificação de segurança para payload nulo
    if (!payload || !payload.gift) {
        console.warn('FullScreenGiftAnimation: payload ou gift é nulo');
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

// Função de comparação personalizada para o memo
const areEqual = (prevProps: { payload: GiftPayload | null }, nextProps: { payload: GiftPayload | null }) => {
    // Se ambos forem nulos, são iguais
    if (prevProps.payload === null && nextProps.payload === null) return true;
    // Se apenas um for nulo, são diferentes
    if (prevProps.payload === null || nextProps.payload === null) return false;
    // Se ambos existirem, compara os IDs
    return prevProps.payload.id === nextProps.payload.id;
};

export default React.memo(FullScreenGiftAnimation, areEqual);