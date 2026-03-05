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

  const LevelHexagon: React.FC<{ level: number, size: 'small' | 'large', type: 'previous' | 'current' | 'next' }> = ({ level, size, type }) => {
    const styles = {
      small: { width: '80px', height: '92px', fontSize: '2rem' },
      large: { width: '120px', height: '138px', fontSize: '3.75rem' }
    };
    const clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

    let bgColor = '';
    if (type === 'current') bgColor = 'linear-gradient(to bottom right, #a855f7, #d946ef)';
    else if (type === 'previous') bgColor = '#4a0e4e';
    else bgColor = '#3f3f46';

    const opacity = type === 'current' ? 1 : 0.5;

    return (
      <div className="flex items-center justify-center" style={{ ...styles[size], clipPath, background: bgColor }}>
        <span className="font-bold" style={{ opacity }}>{level}</span>
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
      <header className="flex items-center p-4 flex-shrink-0">
        <button onClick={onClose} className="absolute z-10"><BackIcon className="w-6 h-6" /></button>
        <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('myLevel.title')}</h1></div>
      </header>
      <main className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#111]">
        <div className="flex justify-center items-center space-x-4">
          {level > 1 && <LevelHexagon level={level - 1} size="small" type="previous" />}
          <LevelHexagon level={level} size="large" type="current" />
          <LevelHexagon level={level + 1} size="small" type="next" />
        </div>
        
        <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold text-gray-300">
                <span>Nível {level}</span>
                <span>Nível {level + 1}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
            </div>
             <div className="text-center text-gray-400 text-sm">{xpProgress.toLocaleString()}/{xpTotalForLevel.toLocaleString()} EXP</div>
        </div>

        <div>
            <h2 className="text-xl font-bold mb-4">{t('myLevel.currentPrivileges', {level: level})}</h2>
            <div className="space-y-3">
                {privileges.length > 0 ? privileges.map(p => (
                  <div key={p} className="bg-[#2c2c2e] p-3 rounded-lg flex items-center space-x-3">
                      <CheckCircleIcon className="w-6 h-6 text-purple-400" />
                      <span className="font-medium">{p}</span>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">Nenhum privilégio neste nível.</p>
                )}
            </div>
        </div>

        <div>
            <h2 className="text-xl font-bold mb-4">{t('myLevel.nextRewards', {level: level + 1})}</h2>
            <div className="space-y-3 opacity-60">
                 {nextRewards.map(r => (
                    <div key={r} className="bg-[#2c2c2e] p-3 rounded-lg flex items-center space-x-3">
                        <LockIcon className="w-6 h-6 text-gray-400" />
                        <span className="font-medium">{r}</span>
                    </div>
                 ))}
            </div>
        </div>

      </main>
    </div>
  );
};

export default MyLevelScreen;