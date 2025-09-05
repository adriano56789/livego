import React, { useState, useRef, useEffect } from 'react';
import type { RouletteSettings, User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import RouletteIcon from './icons/RouletteIcon';
import CrossIcon from './icons/CrossIcon';
import DiamondIcon from './icons/DiamondIcon';

interface RouletteWidgetProps {
  user: User;
  liveId: number;
  initialSettings: RouletteSettings;
  onUpdateUser: (user: User) => void;
  onRequirePurchase: () => void;
}

const RouletteWidget: React.FC<RouletteWidgetProps> = ({ user, liveId, initialSettings, onUpdateUser, onRequirePurchase }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        alert(`Você ganhou: ${result}!`);
        setResult(null);
        setIsOpen(false);
      }, 500); // Show result briefly
    }
  }, [result]);

  const handleSpin = async () => {
    if (isSpinning) return;
    if (user.wallet_diamonds < initialSettings.cost) {
      onRequirePurchase();
      return;
    }
    setIsSpinning(true);
    try {
      const spinResult = await liveStreamService.spinRoulette(liveId, user.id);
      onUpdateUser(spinResult.updatedUser);
      
      const winningIndex = initialSettings.items.indexOf(spinResult.result);
      const degreesPerItem = 360 / initialSettings.items.length;
      const randomOffset = (Math.random() - 0.5) * degreesPerItem * 0.8;
      const targetRotation = 360 * 5 - (winningIndex * degreesPerItem + randomOffset);
      
      setRotation(targetRotation);

      setTimeout(() => {
        setIsSpinning(false);
        setResult(spinResult.result);
      }, 4000); // Match animation duration
    } catch (error) {
      console.error("Failed to spin roulette:", error);
      alert("Ocorreu um erro ao girar a roleta.");
      setIsSpinning(false);
    }
  };

  const itemAngle = 360 / initialSettings.items.length;
  const colors = ["#f87171", "#fb923c", "#facc15", "#a3e635", "#4ade80", "#2dd4bf", "#60a5fa", "#a78bfa"];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-20 w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg animate-roulette-pulse"
      >
        <RouletteIcon className="w-9 h-9 text-black" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4" onClick={() => !isSpinning && setIsOpen(false)}>
      <div 
        className="relative flex flex-col items-center animate-fade-in-fast"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => !isSpinning && setIsOpen(false)} className="absolute -top-4 -right-4 bg-gray-800/50 p-2 rounded-full z-20"><CrossIcon className="w-6 h-6"/></button>
        {/* Pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-x-8 border-x-transparent border-t-[16px] border-t-red-500"></div>

        <div
          ref={wheelRef}
          className="relative w-80 h-80 rounded-full border-4 border-amber-400 bg-gray-800 overflow-hidden transition-transform duration-[4000ms] ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {initialSettings.items.map((item, index) => (
            <div
              key={index}
              className="absolute w-1/2 h-1/2 origin-bottom-right"
              style={{
                transform: `rotate(${index * itemAngle}deg)`,
                clipPath: `polygon(0 0, 100% 0, 100% 100%)`,
              }}
            >
              <div
                className="absolute w-[200%] h-[200%] origin-top-left flex items-center justify-center"
                style={{
                  transform: `rotate(${itemAngle / 2}deg) skewY(-${90 - itemAngle}deg)`,
                  backgroundColor: colors[index % colors.length],
                }}
              >
                 <span className="text-black font-bold text-sm transform -rotate-45" style={{ transform: `skewY(${90 - itemAngle}deg) rotate(${-itemAngle / 2}deg)` }}>
                    {item.substring(0, 10)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="mt-6 bg-gradient-to-r from-green-500 to-teal-400 text-black font-bold py-4 px-10 rounded-full text-xl flex items-center gap-2 disabled:opacity-50"
        >
          Girar!
          <span className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full text-sm font-semibold text-white">
            <DiamondIcon className="w-4 h-4 text-yellow-300"/>
            {initialSettings.cost}
          </span>
        </button>
      </div>
    </div>
  );
};
export default RouletteWidget;
