
import React, { useState, useRef } from 'react';
import type { AppView, ChatMessage } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import GiftDisplayAnimation from './GiftDisplayAnimation';
import CopyIcon from './icons/CopyIcon';

// Hardcoded source code for display
const componentSourceCode = `
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import * as authService from '../services/authService';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface GiftQueueItem {
  id: number; // message id
  giftId: number;
  imageUrl: string;
  senderName: string;
  senderAvatarUrl: string;
  giftName: string;
  recipientName: string;
}

interface GiftDisplayAnimationProps {
  triggeredGift: ChatMessage | null;
}

const GiftDisplayAnimation: React.FC<GiftDisplayAnimationProps> = ({ triggeredGift }) => {
  const [giftQueue, setGiftQueue] = useState<GiftQueueItem[]>([]);
  const [currentGift, setCurrentGift] = useState<(GiftQueueItem & { combo: number }) | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const comboTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (triggeredGift?.giftImageUrl && triggeredGift.giftId && triggeredGift.recipientName) {
      // Check for combo
      if (
        currentGift &&
        isVisible && // Only combo if a gift is currently visible
        currentGift.giftId === triggeredGift.giftId &&
        currentGift.senderName === triggeredGift.username &&
        currentGift.recipientName === triggeredGift.recipientName
      ) {
        // It's a combo, update the current gift's combo count
        setCurrentGift(prev => (prev ? { ...prev, id: triggeredGift.id, combo: prev.combo + 1 } : null));
        return;
      }

      // Not a combo, so add the new gift to the queue
      const fetchAvatarAndAddToQueue = async () => {
        let avatarUrl = '';
        try {
          const profile = await authService.getUserProfile(triggeredGift.userId);
          avatarUrl = profile.avatar_url || '';
        } catch (e) {
          console.error("Failed to fetch sender avatar:", e);
        }
        
        const newGift: GiftQueueItem = {
          id: triggeredGift.id,
          giftId: triggeredGift.giftId!,
          imageUrl: triggeredGift.giftImageUrl!,
          senderName: triggeredGift.username,
          senderAvatarUrl: avatarUrl,
          giftName: triggeredGift.giftName || 'um presente',
          recipientName: triggeredGift.recipientName!,
        };

        setGiftQueue(prev => [...prev, newGift]);
      };
      fetchAvatarAndAddToQueue();
    }
  }, [triggeredGift]);

  useEffect(() => {
    // This effect runs when currentGift changes (new gift or combo increment)
    // It's responsible for managing the display timers.
    if (currentGift) {
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);

      comboTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false); // Start fade-out
      }, 2500);

      const cleanupTimer = setTimeout(() => {
        setCurrentGift(null); // Clear current gift to allow the next one in queue
        comboTimeoutRef.current = null;
      }, 3000); // 2500ms visible + 500ms fade-out animation

      return () => {
        clearTimeout(cleanupTimer);
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      };

    } else if (giftQueue.length > 0) {
      // If no gift is showing, process the next one from the queue
      const nextGift = giftQueue[0];
      setCurrentGift({ ...nextGift, combo: 1 });
      setGiftQueue(prev => prev.slice(1));
      setIsVisible(true);
    }
  }, [currentGift, giftQueue]);


  if (!currentGift) {
    return null;
  }

  return (
    <div
      key={currentGift.id} // Use gift id to re-trigger animation on new gift
      className={\`pointer-events-auto flex items-center p-1 bg-gradient-to-r from-purple-900/80 via-black/70 to-black/70 backdrop-blur-md rounded-full shadow-lg border border-purple-500/50 transform transition-all duration-500 \${isVisible ? 'animate-gift-banner-in' : 'animate-gift-banner-out'}\`}
    >
      <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden shrink-0 border-2 border-purple-400">
        {currentGift.senderAvatarUrl ? (
          <img src={currentGift.senderAvatarUrl} alt={currentGift.senderName} className="w-full h-full object-cover" />
        ) : (
          <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
        )}
      </div>

      <div className="text-white text-sm text-left mx-3 flex-grow">
        <p className="font-bold">{currentGift.senderName}</p>
        <p className="text-xs text-gray-300">enviou {currentGift.giftName}!</p>
      </div>
      
      <img src={currentGift.imageUrl} alt={currentGift.giftName} className="w-12 h-12 object-contain" />
      
      {currentGift.combo > 1 && (
        <div className="text-3xl font-black italic text-yellow-300 drop-shadow-lg animate-combo-thump ml-2 pr-4" key={currentGift.combo}>
          <span className="text-xl font-semibold not-italic">x</span>{currentGift.combo}
        </div>
      )}
    </div>
  );
};

export default GiftDisplayAnimation;
`;

interface ComponentViewerScreenProps {
    onExit: () => void;
}

const ComponentViewerScreen: React.FC<ComponentViewerScreenProps> = ({ onExit }) => {
    const [triggeredGift, setTriggeredGift] = useState<ChatMessage | null>(null);
    const codeSectionRef = useRef<HTMLDivElement>(null);
    const [copySuccess, setCopySuccess] = useState('');

    const triggerAnimation = (giftType: 'rose' | 'car' | 'combo') => {
        let baseGift: ChatMessage = {
            id: Date.now(),
            type: 'gift',
            userId: 10755083, // Current user
            username: 'Você',
            message: 'enviou uma rosa!',
            giftId: 2,
            giftName: 'uma Rosa',
            giftImageUrl: 'https://storage.googleapis.com/genai-assets/livego/rose_gift.png',
            recipientName: 'Streamer',
            timestamp: new Date().toISOString(),
        };

        if (giftType === 'car') {
            baseGift = {
                ...baseGift,
                giftId: 5,
                giftName: 'um Carro Esportivo',
                message: 'enviou um Carro Esportivo!',
                giftImageUrl: 'https://storage.googleapis.com/genai-assets/livego/car_gift.png',
            };
        }
        
        setTriggeredGift(baseGift);

        if (giftType === 'combo') {
            setTimeout(() => setTriggeredGift({ ...baseGift, id: Date.now() + 1 }), 500);
            setTimeout(() => setTriggeredGift({ ...baseGift, id: Date.now() + 2 }), 1000);
            setTimeout(() => setTriggeredGift({ ...baseGift, id: Date.now() + 3 }), 1300);
        }
    };
    
     const copyToClipboard = () => {
        navigator.clipboard.writeText(componentSourceCode.trim()).then(() => {
            setCopySuccess('Copiado!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            setCopySuccess('Falhou');
            console.error('Could not copy text: ', err);
        });
    };

    const handlePreviewClick = () => {
        codeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
            <header className="p-4 flex items-center shrink-0 border-b border-gray-800 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
                <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="font-bold text-lg text-center flex-grow">Visualizador de Componentes</h1>
            </header>
            <main className="flex-grow p-6 overflow-y-auto scrollbar-hide">
                <section className="mb-8">
                     <h2 className="text-2xl font-bold text-gray-300 mb-4 pb-2 border-b-2 border-gray-700">
                      Componente: <span className="text-cyan-400 font-mono">GiftDisplayAnimation</span>
                    </h2>
                    
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-2">Pré-visualização Interativa</h3>
                        <p className="text-sm text-gray-400 mb-3">Clique no quadro abaixo para rolar até o código-fonte. Use os botões para testar as animações.</p>
                        
                        <div 
                            onClick={handlePreviewClick}
                            className="relative h-48 bg-gray-900/50 rounded-lg flex items-center justify-center p-4 border-2 border-gray-700 cursor-pointer transition-all duration-300 hover:border-green-400 hover:bg-gray-900 group"
                            title="Clique para ver o código"
                        >
                            <div className="absolute inset-0 bg-grid-pattern opacity-5 group-hover:opacity-10 transition-opacity"></div>
                            <p className="text-gray-500 italic text-center z-10">A animação aparecerá aqui.</p>
                            <div className="absolute left-4 bottom-4 z-20">
                                <GiftDisplayAnimation triggeredGift={triggeredGift} />
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-4">
                             <button onClick={() => triggerAnimation('rose')} className="bg-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-500 transition-colors">Acionar Rosa</button>
                             <button onClick={() => triggerAnimation('car')} className="bg-purple-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-500 transition-colors">Acionar Carro</button>
                             <button onClick={() => triggerAnimation('combo')} className="bg-yellow-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-yellow-500 transition-colors">Acionar Combo</button>
                        </div>
                    </div>

                    <div ref={codeSectionRef}> 
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-white">Código Fonte (GiftDisplayAnimation.tsx)</h3>
                             <button onClick={copyToClipboard} className="flex items-center gap-2 text-sm bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-600 transition-colors">
                                {copySuccess ? (
                                    <span className="text-green-400">{copySuccess}</span>
                                ) : (
                                    <>
                                        <CopyIcon className="w-4 h-4" />
                                        Copiar
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-lg max-h-[50vh] overflow-auto border border-gray-700">
                            <pre><code className="text-sm font-mono text-cyan-300">{componentSourceCode.trim()}</code></pre>
                        </div>
                    </div>
                </section>
            </main>
             <style>{`
              .bg-grid-pattern {
                background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                background-size: 20px 20px;
              }
            `}</style>
        </div>
    );
};

export default ComponentViewerScreen;
