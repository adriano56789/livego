
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { User, UserLevelInfo } from '../types';
import * as levelService from '../services/levelService';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import LevelBadge60Icon from './icons/LevelBadge60Icon';
import LevelBadge70Icon from './icons/LevelBadge70Icon';
import LevelBadge80Icon from './icons/LevelBadge80Icon';
import LevelBadge90Icon from './icons/LevelBadge90Icon';
import LevelBadge100Icon from './icons/LevelBadge100Icon';
import LevelBadge150Icon from './icons/LevelBadge150Icon';
import LevelBadge200Icon from './icons/LevelBadge200Icon';
import LevelBadge300Icon from './icons/LevelBadge300Icon';
import LevelBadge500Icon from './icons/LevelBadge500Icon';
import LevelBadge1000Icon from './icons/LevelBadge1000Icon';

interface MyLevelScreenProps {
  user: User;
  onExit: () => void;
}

const milestones = [
    { level: 60, icon: LevelBadge60Icon },
    { level: 70, icon: LevelBadge70Icon },
    { level: 80, icon: LevelBadge80Icon },
    { level: 90, icon: LevelBadge90Icon },
    { level: 100, icon: LevelBadge100Icon },
    { level: 150, icon: LevelBadge150Icon },
    { level: 200, icon: LevelBadge200Icon },
    { level: 300, icon: LevelBadge300Icon },
    { level: 500, icon: LevelBadge500Icon },
    { level: 1000, icon: LevelBadge1000Icon },
];

const LevelMilestone: React.FC<{
  level: number;
  Icon: React.FC<any>;
  isCenter: boolean;
}> = ({ level, Icon, isCenter }) => {
  
  const containerClasses = `relative w-28 h-32 flex items-center justify-center transition-all duration-300 shrink-0 ${isCenter ? 'transform scale-125 z-10' : 'opacity-80'}`;

  const numberBgColor = useMemo(() => {
    switch(level) {
      case 60: return 'bg-gradient-to-br from-blue-500 to-cyan-400';
      case 100: return 'bg-gradient-to-br from-blue-600 to-sky-500';
      case 70: return 'bg-gradient-to-br from-pink-500 to-fuchsia-400';
      case 80: return 'bg-gradient-to-br from-rose-500 to-pink-500';
      case 90: return 'bg-gradient-to-br from-purple-500 to-violet-500';
      case 150: return 'bg-gradient-to-br from-red-500 to-orange-500';
      case 200: return 'bg-gradient-to-br from-indigo-500 to-purple-500';
      case 300: return 'bg-gradient-to-br from-amber-400 to-yellow-500';
      case 500: return 'bg-gradient-to-br from-lime-400 to-green-500';
      case 1000: return 'bg-gradient-to-br from-fuchsia-500 to-purple-600';
      default: return 'bg-gray-500';
    }
  }, [level]);

  return (
    <div className={containerClasses}>
      <svg className="absolute w-full h-full drop-shadow-[0_0_10px_rgba(192,132,252,0.3)]" viewBox="0 0 100 115">
        <defs>
          <linearGradient id={`grad-hex-${level}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a2d5c" />
            <stop offset="100%" stopColor="#1e123b" />
          </linearGradient>
           <linearGradient id={`border-grad-hex-${level}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        <path d="M50 0 L100 28.87 V86.6 L50 115.47 L0 86.6 V28.87 Z" fill={`url(#grad-hex-${level})`} stroke={`url(#border-grad-hex-${level})`} strokeWidth="2"/>
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg shadow-lg ${numberBgColor}`}>
          <div className="w-7 h-7">
              <Icon />
          </div>
          <span className="font-bold text-white text-xl">{level}</span>
        </div>
      </div>
    </div>
  );
};

const BottomTimeline = () => (
  <div className="shrink-0 w-full h-24 relative">
      <div className="absolute bottom-12 left-0 right-0 h-10 flex justify-center items-end">
           <div className="w-[150%] h-24 border-b-2 border-gray-600/50 rounded-[50%]"></div>
      </div>
      <div className="absolute w-2.5 h-2.5 bg-gray-600 rounded-full" style={{bottom: '30px', left: '10%'}}></div>
      <div className="absolute w-2.5 h-2.5 bg-gray-600 rounded-full" style={{bottom: '45px', left: '28%'}}></div>
      <div className="absolute w-4 h-4 bg-white rounded-full shadow-lg" style={{bottom: '52px', left: '50%', transform: 'translateX(-50%)'}}></div>
      <div className="absolute w-2.5 h-2.5 bg-gray-600 rounded-full" style={{bottom: '45px', right: '28%'}}></div>
      <div className="absolute w-2.5 h-2.5 bg-gray-600 rounded-full" style={{bottom: '30px', right: '10%'}}></div>
  </div>
);


const MyLevelScreen: React.FC<MyLevelScreenProps> = ({ user, onExit }) => {
  const [levelInfo, setLevelInfo] = useState<UserLevelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLevelInfo = async () => {
      setIsLoading(true);
      try {
        const data = await liveStreamService.getUserLevelInfo(user.id);
        setLevelInfo(data);
      } catch (error) {
        console.error("Failed to fetch level info:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLevelInfo();
  }, [user.id]);

  const { progressPercent, centralMilestoneLevel } = useMemo(() => {
    if (!levelInfo) return { progressPercent: 0, centralMilestoneLevel: milestones[2].level };
    
    const xpForCurrentLevelStart = levelService.getXpForLevel(levelInfo.currentLevel);
    const xpNeededForLevel = levelInfo.xpForNextLevel - xpForCurrentLevelStart;
    const xpInCurrentLevel = levelInfo.currentXp - xpForCurrentLevelStart;

    const progressPercent = xpNeededForLevel > 0 
        ? Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForLevel) * 100))
        : 100;
    
    // Find the first milestone that is greater than or equal to the current level
    const nextMilestone = milestones.find(m => m.level >= levelInfo.currentLevel);
    let centralLevel: number;
    if (nextMilestone) {
        centralLevel = nextMilestone.level;
    } else {
        // If user is past all milestones, center on the last one
        centralLevel = milestones[milestones.length - 1].level;
    }
        
    return { progressPercent, centralMilestoneLevel: centralLevel };
  }, [levelInfo]);
  
  useEffect(() => {
    if (timelineRef.current && !isLoading) {
      const targetIndex = milestones.findIndex(m => m.level === centralMilestoneLevel);
      if (targetIndex !== -1) {
        const targetElement = timelineRef.current.children[targetIndex] as HTMLElement;
        if (targetElement) {
          const scrollLeft = targetElement.offsetLeft - (timelineRef.current.offsetWidth / 2) + (targetElement.offsetWidth / 2);
          timelineRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }
  }, [isLoading, centralMilestoneLevel]);

  const renderContent = () => {
    if (isLoading || !levelInfo) {
      return (
        <main className="flex-grow flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </main>
      );
    }
    
    return (
      <main className="flex-grow flex flex-col justify-between overflow-hidden">
        <div 
            ref={timelineRef}
            className="flex-grow flex items-center gap-x-8 px-16 overflow-x-auto scrollbar-hide"
        >
             {milestones.map(m => (
                <LevelMilestone 
                    key={m.level}
                    level={m.level}
                    Icon={m.icon}
                    isCenter={m.level === centralMilestoneLevel}
                />
             ))}
        </div>

        <div className="shrink-0 p-6 bg-black/20 backdrop-blur-sm">
            <div className="w-full bg-black rounded-full h-4 border border-gray-700">
                <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
            <div className="flex justify-between items-center text-lg font-bold mt-2">
                <span className="text-white">Lv.{levelInfo.currentLevel}</span>
                <span className="text-gray-400">{(levelInfo.currentXp || 0).toLocaleString()}/{(levelInfo.xpForNextLevel || 0).toLocaleString()}</span>
            </div>
            <BottomTimeline />
        </div>
      </main>
    );
  };

  return (
    <div className="h-screen w-full bg-[#0f0b1e] text-white flex flex-col font-sans overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dot-grid.png')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-purple-900/50 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-pink-900/40 to-transparent blur-3xl"></div>
      <header className="relative z-10 p-4 flex items-center justify-between shrink-0">
        <button onClick={onExit} className="p-2 -m-2"><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-xl absolute left-1/2 -translate-x-1/2">NÍVEL</h1>
        <div className="w-6 h-6"></div>
      </header>
      {renderContent()}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MyLevelScreen;
