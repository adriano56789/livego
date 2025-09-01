
import React from 'react';
import type { PkBattleState } from '../types';
import StarIcon from './icons/StarIcon';
import LightningIcon from './icons/LightningIcon';

interface PkTimerProps {
  startTime: string;
  durationSeconds: number;
}

const PkTimer: React.FC<PkTimerProps> = ({ startTime, durationSeconds }) => {
    const calculateTimeLeft = React.useCallback(() => {
        const endTime = new Date(startTime).getTime() + durationSeconds * 1000;
        const difference = endTime - Date.now();
        if (difference <= 0) return { m: 0, s: 0 };

        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return { m: minutes, s: seconds };
    }, [startTime, durationSeconds]);

    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

    React.useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    return <span>{`PK ${String(timeLeft.m).padStart(2, '0')}:${String(timeLeft.s).padStart(2, '0')}`}</span>;
};


interface PkBattleOverlayProps {
  battle: PkBattleState;
  streamer1WinMultiplier: number;
  streamer2WinMultiplier: number;
  isCoHost?: boolean;
}

const PkBattleOverlay: React.FC<PkBattleOverlayProps> = ({ battle, streamer1WinMultiplier, streamer2WinMultiplier, isCoHost }) => {
    return (
        <div className="flex flex-col gap-2 pointer-events-none text-white font-sans w-full">
            <div className="flex justify-between items-center px-4 mt-2">
                <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 font-bold text-sm">
                    WIN &times; {streamer1WinMultiplier}
                </div>
                <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 font-black text-lg tracking-wider shadow-lg">
                    <PkTimer startTime={battle.data_inicio} durationSeconds={battle.duracao_segundos} />
                </div>
                <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 font-bold text-sm">
                    WIN &times; {streamer2WinMultiplier}
                </div>
            </div>
        </div>
    );
};

export default PkBattleOverlay;
