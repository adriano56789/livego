
import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import GiftPrizeIcon from './icons/GiftPrizeIcon';
import DiamondIcon from './icons/DiamondIcon';
import SettingsIcon from './icons/SettingsIcon';
import PrizeWheelSetupModal from './PrizeWheelSetupModal';

// Prize Won Modal Component
const PrizeWonModal: React.FC<{ prize: string; onClose: () => void; }> = ({ prize, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const isSpecialGift = prize === '🎁';
  const message = isSpecialGift ? "um Presente Especial" : `"${prize}"`;

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2500); // Start exit animation after 2.5s

    const closeTimer = setTimeout(() => {
      onClose();
    }, 3000); // Fully close after 3s
  
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 font-sans ${isExiting ? 'animate-fade-out-fast' : 'animate-fade-in-fast'}`} onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-sm p-6 text-center text-black flex flex-col items-center shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <GiftPrizeIcon className="w-20 h-20 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Parabéns!</h2>
        <p className="text-gray-600 mt-2">Você ganhou</p>
        <p className="text-2xl font-bold text-purple-600 my-2">{message}</p>
      </div>
    </div>
  );
};


interface PrizeWheelModalProps {
    user: User;
    onUpdateUser: (user: User) => void;
    onClose: () => void;
    onRechargeClick: () => void;
    isHost: boolean;
}

const initialPrizes = ['uma foto', '🎁', 'um vídeo', 'Supresas', '5 surpresas', '🎁', '6 surpresas', 'Supresas'];
const initialCost = 1000;

const PrizeWheelModal: React.FC<PrizeWheelModalProps> = ({ user, onUpdateUser, onClose, onRechargeClick, isHost }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [prizes, setPrizes] = useState(initialPrizes);
    const [cost, setCost] = useState(initialCost);
    const [prizeResult, setPrizeResult] = useState<string | null>(null);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

    const segmentAngle = 360 / prizes.length;
    
    const conicGradientStyle = useMemo(() => {
        const colors = ['#f3e8ff', '#faf5ff'];
        const gradientStops = prizes.map((_, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = (i + 1) * segmentAngle;
            const color = colors[i % 2];
            return `${color} ${startAngle}deg ${endAngle}deg`;
        });
        return `conic-gradient(${gradientStops.join(', ')})`;
    }, [prizes, segmentAngle]);


    const handleSpin = async () => {
        if (isSpinning) return;
        if (user.wallet_diamonds < cost) {
            onRechargeClick();
            return;
        }
        
        setIsSpinning(true);
        onUpdateUser({ ...user, wallet_diamonds: user.wallet_diamonds - cost });

        await new Promise(resolve => setTimeout(resolve, 300));

        const winningSegment = Math.floor(Math.random() * prizes.length);
        const prize = prizes[winningSegment];

        const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8);
        const finalRotation = rotation + (360 * 5) - (winningSegment * segmentAngle) - randomOffset;

        setRotation(finalRotation);

        setTimeout(() => {
            setIsSpinning(false);
            setPrizeResult(prize);
        }, 4500);
    };
    
    const handleSaveSettings = ({ prizes: newPrizes, cost: newCost }: { prizes: string[], cost: number }) => {
        setPrizes(newPrizes);
        setCost(newCost);
        setIsSetupModalOpen(false);
    };

    const handleClosePrizeModal = () => {
        setPrizeResult(null);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4 font-sans animate-fade-in-fast" onClick={onClose}>
                
                <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
                    <div 
                      className="relative w-[95vw] max-w-md aspect-square flex items-center justify-center"
                    >
                         <div className="absolute top-4 right-4 z-30 flex gap-2">
                             {isHost && (
                                <button onClick={() => setIsSetupModalOpen(true)} disabled={isSpinning} className="bg-gray-700/80 rounded-full w-10 h-10 flex items-center justify-center shadow-lg disabled:opacity-50">
                                    <SettingsIcon className="w-6 h-6 text-white" />
                                </button>
                            )}
                            <button onClick={onClose} className="bg-blue-500/80 rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                                <ChevronDownIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <div className="absolute w-[95%] h-[95%] rounded-full animate-prize-wheel-glow"></div>

                        <div className="absolute w-[90%] h-[90%] rounded-full bg-gradient-to-br from-[#c084fc] to-[#6d28d9] p-2">
                            <div className="w-full h-full rounded-full bg-[#4c1d95] p-2">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#c084fc] to-[#6d28d9]"></div>
                            </div>
                        </div>

                        <div className="absolute -top-2 z-20 flex flex-col items-center">
                            <div className="w-0 h-0 border-x-8 border-x-transparent border-b-[16px] border-b-gray-200"></div>
                            <div className="w-4 h-4 bg-gray-200 rounded-b-full"></div>
                        </div>

                        <div 
                            className="relative w-[75%] h-[75%] rounded-full transition-transform duration-[4000ms] ease-out"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        >
                           <div 
                                className="absolute inset-0 w-full h-full rounded-full"
                                style={{ background: conicGradientStyle }}
                            />
                            
                            <div className="absolute inset-0 w-full h-full">
                                {prizes.map((prize, i) => {
                                    const midAngle = i * segmentAngle + segmentAngle / 2;
                                    const radiusPercent = 35; // 35% from center
                                    const xPercent = 50 + radiusPercent * Math.cos(midAngle * Math.PI / 180);
                                    const yPercent = 50 + radiusPercent * Math.sin(midAngle * Math.PI / 180);

                                    return (
                                        <div
                                            key={i}
                                            className="absolute flex items-center justify-center"
                                            style={{
                                                width: '90px',
                                                height: '50px',
                                                left: `${xPercent}%`,
                                                top: `${yPercent}%`,
                                                transform: `translate(-50%, -50%) rotate(${midAngle + 90}deg)`,
                                            }}
                                        >
                                            {prize === '🎁' ? (
                                                <GiftPrizeIcon className="w-10 h-10" />
                                            ) : (
                                                <span className="text-[#4c1d95] font-bold text-sm text-center">
                                                    {prize}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                        </div>

                        <button 
                            onClick={handleSpin}
                            disabled={isSpinning}
                            className="absolute w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-4xl font-bold text-gray-400 border-4 border-gray-300 shadow-inner disabled:opacity-70"
                        >
                            GO
                        </button>
                    </div>
                    
                    <footer className="w-full max-w-md flex flex-col items-center gap-4">
                        <div className="bg-black/50 p-3 rounded-lg text-center text-white">
                            <p className="text-sm">Roleta</p>
                            <div className="flex items-center justify-center gap-3 mt-1">
                                <div className="flex items-center gap-1.5 font-semibold">
                                    <DiamondIcon className="w-5 h-5"/>
                                    <span>{cost.toLocaleString()}</span>
                                </div>
                                <span>=</span>
                                <div className="px-3 py-1 bg-purple-600 rounded-full font-bold text-sm">
                                    GO x1
                                </div>
                            </div>
                        </div>
                        <p className="bg-purple-600/80 p-3 rounded-full text-white font-semibold text-center w-full">
                            Dê um presente para ganhar 1 chance de sorteio
                        </p>
                    </footer>
                </div>
            </div>
            {prizeResult && <PrizeWonModal prize={prizeResult} onClose={handleClosePrizeModal} />}
            {isHost && (
                <PrizeWheelSetupModal
                    isOpen={isSetupModalOpen}
                    onClose={() => setIsSetupModalOpen(false)}
                    onSave={handleSaveSettings}
                    initialPrizes={prizes}
                    initialCost={cost}
                />
            )}
        </>
    );
};

export default PrizeWheelModal;
