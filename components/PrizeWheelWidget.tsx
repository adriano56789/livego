import React from 'react';

const PrizeWheelWidget: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-36 right-4 z-20 w-16 h-16 rounded-full flex items-center justify-center shadow-lg animate-roulette-pulse"
    style={{
      backgroundImage: 'linear-gradient(135deg, #a855f7, #6d28d9)',
      border: '3px solid #c084fc',
    }}
    aria-label="Abrir roleta de prêmios"
  >
    <span className="text-white font-bold text-xs transform -rotate-12">Roleta</span>
  </button>
);

export default PrizeWheelWidget;
