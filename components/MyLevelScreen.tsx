import React, { useState, useEffect } from 'react';
import { BackIcon } from './icons';
import { useTranslation } from '../i18n';
import { User, LevelInfo } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

// Adicionar animações CSS personalizadas
const style = document.createElement('style');
style.textContent = `
  @keyframes fireAnimation {
    0%, 100% { 
      transform: translateY(0px) scale(1); 
      opacity: 0.6;
    }
    25% { 
      transform: translateY(-3px) scale(1.05); 
      opacity: 0.8;
    }
    50% { 
      transform: translateY(-5px) scale(1.1); 
      opacity: 1;
    }
    75% { 
      transform: translateY(-3px) scale(1.05); 
      opacity: 0.8;
    }
  }
  
  @keyframes floatFire {
    0%, 100% { 
      transform: translateY(0px) rotate(0deg); 
      opacity: 0.7;
    }
    33% { 
      transform: translateY(-8px) rotate(5deg); 
      opacity: 1;
    }
    66% { 
      transform: translateY(-12px) rotate(-5deg); 
      opacity: 0.9;
    }
  }
`;
document.head.appendChild(style);

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
      // Usar o novo sistema de nível
      api.level.getLevelInfo(currentUser.id)
        .then(response => {
          setLevelInfo({
            level: response.level,
            xp: response.currentExp,
            xpForNextLevel: response.expForNextLevel,
            xpForCurrentLevel: 0, // O novo sistema não usa isso
            progress: response.progress,
            privileges: [], // Sistema simplificado sem privilégios
            nextRewards: [], // Sistema simplificado sem recompensas
            totalExp: response.totalExp,
            rank: response.rank,
            lastGain: response.lastGain
          });
        })
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
    // Garantir que o nível seja válido
    const safeLevel = isNaN(level) || level < 1 ? 1 : level;
    
    const styles = {
      small: { width: '80px', height: '92px', fontSize: '2rem' },
      large: { width: '130px', height: '150px', fontSize: '4rem' }
    };
    const clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

    let bgColor = '';
    let shadow = '';
    let textColor = '';
    let glowEffect = '';
    let fireEffect = '';

    if (type === 'current') {
      // Nível atual - cores vibrantes estilo TikTok COM FOGO 
      if (safeLevel >= 10) {
        bgColor = 'linear-gradient(135deg, #FFD700, #FFA500, #FF6347)'; // Dourado para níveis altos
        shadow = '0 0 40px rgba(255, 69, 0, 0.8), 0 0 60px rgba(255, 140, 0, 0.6), 0 0 80px rgba(255, 215, 0, 0.4)';
        textColor = '#FFFFFF';
        glowEffect = '0 0 30px rgba(255, 69, 0, 1), 0 0 50px rgba(255, 140, 0, 0.8)';
        fireEffect = 'linear-gradient(45deg, #FF4500, #FF6347, #FFD700, #FFA500, #FF4500)';
      } else if (safeLevel >= 5) {
        bgColor = 'linear-gradient(135deg, #8B5CF6, #3B82F6, #06B6D4)'; // Roxo → Azul → Ciano
        shadow = '0 0 35px rgba(255, 69, 0, 0.7), 0 0 55px rgba(139, 92, 246, 0.5), 0 0 75px rgba(59, 130, 246, 0.3)';
        textColor = '#FFFFFF';
        glowEffect = '0 0 25px rgba(255, 69, 0, 0.9), 0 0 40px rgba(139, 92, 246, 0.7)';
        fireEffect = 'linear-gradient(45deg, #FF4500, #FF6347, #FFA500, #FF6347, #FF4500)';
      } else {
        bgColor = 'linear-gradient(135deg, #3B82F6, #06B6D4)'; // Azul neon
        shadow = '0 0 30px rgba(255, 69, 0, 0.6), 0 0 50px rgba(59, 130, 246, 0.4), 0 0 70px rgba(6, 182, 212, 0.3)';
        textColor = '#FFFFFF';
        glowEffect = '0 0 20px rgba(255, 69, 0, 0.8), 0 0 35px rgba(59, 130, 246, 0.6)';
        fireEffect = 'linear-gradient(45deg, #FF4500, #FF6347, #FFA500, #FF6347, #FF4500)';
      }
    } else if (type === 'previous') {
      bgColor = 'linear-gradient(135deg, #6B7280, #4B5563)'; // Cinza suave
      shadow = '0 0 8px rgba(107, 114, 128, 0.3)';
      textColor = '#D1D5DB';
      glowEffect = 'none';
      fireEffect = 'none';
    } else {
      bgColor = 'linear-gradient(135deg, #374151, #1F2937)'; // Cinza mais fraco
      shadow = '0 0 5px rgba(55, 65, 81, 0.2)';
      textColor = '#9CA3AF';
      glowEffect = 'none';
      fireEffect = 'none';
    }

    const opacity = type === 'current' ? 1 : type === 'previous' ? 0.8 : 0.5;

    return (
      <div 
        id={type === 'current' ? 'current-level' : undefined}
        className={`flex items-center justify-center transition-all duration-300 ${type === 'current' ? 'transform hover:scale-110 animate-pulse' : ''}`}
        style={{ 
          ...styles[size], 
          clipPath, 
          background: type === 'current' ? fireEffect : bgColor,
          boxShadow: shadow,
          filter: type === 'current' ? 'brightness(1.3) saturate(1.2)' : 'brightness(0.8)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Efeito de fogo animado */}
        {type === 'current' && (
          <>
            <div 
              className="absolute inset-0 opacity-60 animate-pulse"
              style={{
                background: 'linear-gradient(45deg, transparent, rgba(255, 69, 0, 0.3), transparent)',
                animation: 'fireAnimation 2s ease-in-out infinite'
              }}
            />
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                background: 'linear-gradient(-45deg, transparent, rgba(255, 140, 0, 0.4), transparent)',
                animation: 'fireAnimation 1.5s ease-in-out infinite reverse'
              }}
            />
          </>
        )}
        
        <span 
          className={`font-bold transition-all duration-300 ${type === 'current' ? 'animate-bounce' : ''}`}
          style={{ 
            opacity,
            color: textColor,
            textShadow: glowEffect,
            fontSize: type === 'current' ? '4.5rem' : styles[size].fontSize,
            position: 'relative',
            zIndex: 10,
            filter: type === 'current' ? 'drop-shadow(0 0 10px rgba(255, 69, 0, 0.8))' : 'none'
          }}
        >
          {safeLevel}
        </span>

        {/* Chamas decorativas */}
        {type === 'current' && (
          <>
            <span 
              className="absolute -top-2 -left-2 text-xl animate-pulse"
              style={{ 
                animation: 'floatFire 3s ease-in-out infinite',
                filter: 'drop-shadow(0 0 8px rgba(255, 69, 0, 0.9))'
              }}
            >
              🔥
            </span>
            <span 
              className="absolute -top-2 -right-2 text-xl animate-pulse"
              style={{ 
                animation: 'floatFire 3s ease-in-out infinite 1s',
                filter: 'drop-shadow(0 0 8px rgba(255, 140, 0, 0.9))'
              }}
            >
              🔥
            </span>
          </>
        )}
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
  const safeLevel = level || 1;
  const safeXp = xp || 0;
  const safeXpForNextLevel = xpForNextLevel || 100;
  const safeProgress = progress || 0;
  const xpProgress = safeXp;
  const xpTotalForLevel = safeXpForNextLevel;

  // Gerar sequência de níveis para visualização
  const levelSequence = [];
  const startLevel = Math.max(1, safeLevel - 2);
  const endLevel = safeLevel + 2;
  
  for (let i = startLevel; i <= endLevel; i++) {
    let type: 'previous' | 'current' | 'next' = 'next';
    if (i === safeLevel) type = 'current';
    else if (i < safeLevel) type = 'previous';
    
    // Garantir que o nível seja válido
    const validLevel = isNaN(i) ? 1 : i;
    levelSequence.push({ level: validLevel, type });
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
              {safeLevel}
            </div>
          </div>
        </div>
        
        {/* Barra de progresso EXP */}
        <div className="space-y-4 max-w-md mx-auto w-full">
            <div className="flex justify-between text-sm font-semibold text-gray-300">
                <span>Nível {safeLevel}</span>
                <span>Nível {safeLevel + 1}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{width: `${safeProgress}%`}}
                ></div>
            </div>
            <div className="text-center text-gray-400 text-sm">
              {xpProgress.toLocaleString()}/{xpTotalForLevel.toLocaleString()} EXP
            </div>
        </div>

        {/* Destaque especial para níveis mais altos */}
        {safeLevel >= 10 && (
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