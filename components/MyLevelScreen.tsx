import React, { useState, useEffect } from 'react';
import { BackIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, LevelInfo } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface MyLevelScreenProps {
  onClose: () => void;
  currentUser: User;
}

const MyLevelScreen: React.FC<MyLevelScreenProps> = ({ onClose, currentUser }) => {
  const { t } = useTranslation();
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      api.getLevelInfo(currentUser.id)
        .then(setLevelInfo)
        .catch(err => console.error("Failed to load level info:", err))
        .finally(() => setIsLoading(false));
    }
  }, [currentUser]);

  // Detectar mudança de nível para animação
  useEffect(() => {
    if (levelInfo && previousLevel !== null && previousLevel !== levelInfo.level) {
      // Animação quando sobe de nível
      const levelElement = document.getElementById('current-level');
      if (levelElement) {
        levelElement.classList.add('animate-bounce', 'duration-500');
        setTimeout(() => {
          levelElement.classList.remove('animate-bounce', 'duration-500');
        }, 500);
      }
    }
    if (levelInfo) {
      setPreviousLevel(levelInfo.level);
    }
  }, [levelInfo, previousLevel]);

  const LevelHexagon: React.FC<{ level: number, size: 'small' | 'large', type: 'previous' | 'current' | 'next' }> = ({ level, size, type }) => {
    const styles = {
      small: { width: '80px', height: '92px', fontSize: '2rem' },
      large: { width: '130px', height: '150px', fontSize: '4rem' }
    };
    const clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

    let bgColor = '';
    let shadow = '';
    if (type === 'current') {
      bgColor = 'linear-gradient(135deg, #8b5cf6, #d946ef)';
      shadow = '0 0 20px rgba(139, 92, 246, 0.4)';
    } else if (type === 'previous') {
      bgColor = 'linear-gradient(135deg, #4a0e4e, #6b1e6b)';
      shadow = '0 0 10px rgba(74, 14, 78, 0.2)';
    } else {
      bgColor = 'linear-gradient(135deg, #3f3f46, #4b5563)';
      shadow = '0 0 5px rgba(63, 63, 70, 0.1)';
    }

    const opacity = type === 'current' ? 1 : type === 'previous' ? 0.7 : 0.4;

    return (
      <div 
        id={type === 'current' ? 'current-level' : undefined}
        className={`flex items-center justify-center transition-all duration-400 ${type === 'current' ? 'transform hover:scale-105' : ''}`}
        style={{ 
          ...styles[size], 
          clipPath, 
          background: bgColor,
          boxShadow: shadow,
          filter: type === 'current' ? 'brightness(1.1)' : 'brightness(0.9)'
        }}
      >
        <span 
          className="font-bold text-white"
          style={{ 
            opacity,
            textShadow: type === 'current' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
          }}
        >
          {level}
        </span>
      </div>
    );
  };
  
  if (isLoading || !levelInfo) {
    return (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="absolute z-10"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">Meu Nível</h1></div>
            </header>
            <div className="flex-grow flex items-center justify-center">
                <LoadingSpinner />
            </div>
        </div>
    );
  }

  const { level, xp, xpForNextLevel, progress } = levelInfo;
  const xpProgress = xp - levelInfo.xpForCurrentLevel;
  const xpTotalForLevel = xpForNextLevel - levelInfo.xpForCurrentLevel;

  // Gerar sequência de níveis para visualização
  const levelSequence = [];
  const startLevel = Math.max(1, level - 2);
  const endLevel = level + 2;
  
  for (let i = startLevel; i <= endLevel; i++) {
    let type: 'previous' | 'current' | 'next' = 'next';
    if (i === level) type = 'current';
    else if (i < level) type = 'previous';
    
    levelSequence.push({ level: i, type });
  }

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col text-white font-sans">
      <header className="flex items-center p-4 flex-shrink-0">
        <button onClick={onClose} className="absolute z-10"><BackIcon className="w-6 h-6" /></button>
        <div className="flex-grow text-center"><h1 className="text-xl font-bold">Meu Nível</h1></div>
      </header>
      <main className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#111] flex flex-col justify-center">
        
        {/* Níveis em sequência com destaque para o atual */}
        <div className="flex justify-center items-center space-x-4">
          {levelSequence.map(({ level: lvl, type }) => (
            <LevelHexagon 
              key={lvl} 
              level={lvl} 
              size={type === 'current' ? 'large' : 'small'} 
              type={type} 
            />
          ))}
        </div>
        
        {/* Indicador visual do nível atual */}
        <div className="flex justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-2">Nível Atual</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {level}
            </div>
          </div>
        </div>
        
        {/* Barra de progresso EXP */}
        <div className="space-y-4 max-w-md mx-auto w-full">
            <div className="flex justify-between text-sm font-semibold text-gray-300">
                <span>Nível {level}</span>
                <span>Nível {level + 1}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{width: `${progress}%`}}
                ></div>
            </div>
            <div className="text-center text-gray-400 text-sm">
              {xpProgress.toLocaleString()}/{xpTotalForLevel.toLocaleString()} EXP
            </div>
        </div>

        {/* Destaque especial para níveis mais altos */}
        {level >= 10 && (
          <div className="text-center">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
              <span className="text-lg font-bold text-white">🌟 Nível Avançado 🌟</span>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default MyLevelScreen;