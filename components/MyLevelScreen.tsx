
import React, { useState, useEffect } from 'react';
import { BackIcon, CheckCircleIcon, LockIcon } from './icons';
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

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      api.getLevelInfo(currentUser.id)
        .then(setLevelInfo)
        .catch(err => console.error("Failed to load level info:", err))
        .finally(() => setIsLoading(false));
    }
  }, [currentUser]);

  const LevelBadgeSVG: React.FC<{ level: number, type: 'current' | 'secondary' }> = ({ level, type }) => {
    const isCurrent = type === 'current';
    const size = isCurrent ? 140 : 80;
    const fontSize = isCurrent ? '4rem' : '2rem';
    const textColor = isCurrent ? 'white' : '#6b7280'; // gray-500 for secondary

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <defs>
            <linearGradient id="levelGradient" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A855F7" /> {/* purple-500 */}
              <stop offset="1" stopColor="#7E22CE" /> {/* purple-700 */}
            </linearGradient>
            <linearGradient id="levelBevel" x1="50" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
               <stop stopColor="white" stopOpacity="0.3" />
               <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Hexagon Shape: Pointy Top */}
          <path
            d="M50 2 L93.3 27 V77 L50 102 L6.7 77 V27 L50 2 Z"
            fill={isCurrent ? "url(#levelGradient)" : "#27272a"} /* zinc-800 for secondary */
            stroke={isCurrent ? "none" : "#3f3f46"} /* zinc-700 stroke */
            strokeWidth={isCurrent ? "0" : "2"}
          />
          
          {/* Inner Bevel for Current Level 3D effect */}
          {isCurrent && (
             <path
                d="M50 8 L88 30 V70 L50 92 L12 70 V30 L50 8 Z"
                fill="url(#levelBevel)"
             />
          )}
        </svg>
        <span 
            className="absolute font-bold" 
            style={{ 
                fontSize, 
                color: textColor,
                textShadow: isCurrent ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
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
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('myLevel.title')}</h1></div>
            </header>
            <div className="flex-grow flex items-center justify-center">
                <LoadingSpinner />
            </div>
        </div>
    );
  }

  const { level, xp, xpForNextLevel, progress, privileges, nextRewards } = levelInfo;
  const xpProgress = xp - levelInfo.xpForCurrentLevel;
  const xpTotalForLevel = xpForNextLevel - levelInfo.xpForCurrentLevel;

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col text-white font-sans">
      <header className="flex items-center p-4 flex-shrink-0 bg-[#181818]">
        <button onClick={onClose} className="absolute z-10"><BackIcon className="w-6 h-6" /></button>
        <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('myLevel.title')}</h1></div>
      </header>
      
      <main className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#111]">
        
        {/* Badges Container */}
        <div className="flex justify-center items-center py-8 relative">
            {/* Previous Level (Hidden or Faded to left if needed, but design shows mainly current and next) */}
            
            {/* Current Level - Centered */}
            <div className="z-10 transform scale-110">
                <LevelBadgeSVG level={level} type="current" />
            </div>

            {/* Next Level - To the right */}
            <div className="absolute right-8 opacity-80 transform translate-y-2">
                <LevelBadgeSVG level={level + 1} type="secondary" />
            </div>
        </div>
        
        {/* Progress Section */}
        <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold text-gray-200">
                <span>Nível {level}</span>
                <span>Nível {level + 1}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div 
                    className="bg-white h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
             <div className="text-center text-gray-400 text-xs font-medium pt-1">
                 {xpProgress} / {xpTotalForLevel} EXP
             </div>
        </div>

        <div className="h-px bg-gray-800 w-full my-4"></div>

        {/* Current Privileges */}
        <div>
            <h2 className="text-lg font-bold mb-4 text-white">{t('myLevel.currentPrivileges', {level: level})}</h2>
            <div className="space-y-3">
                {privileges.length > 0 ? privileges.map(p => (
                  <div key={p} className="bg-[#2c2c2e] p-4 rounded-xl flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-purple-500" />
                      <span className="font-medium text-gray-200 text-sm">{p}</span>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4 text-sm">Nenhum privilégio neste nível.</p>
                )}
            </div>
        </div>

        {/* Next Rewards */}
        <div>
            <h2 className="text-lg font-bold mb-4 text-white">{t('myLevel.nextRewards', {level: level + 1})}</h2>
            <div className="space-y-3">
                 {nextRewards.map(r => (
                    <div key={r} className="bg-[#2c2c2e] p-4 rounded-xl flex items-center space-x-4 opacity-80">
                        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                            <LockIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-300 text-sm">{r}</span>
                    </div>
                 ))}
            </div>
        </div>

      </main>
    </div>
  );
};

export default MyLevelScreen;
