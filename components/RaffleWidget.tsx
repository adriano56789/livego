import React, { useState, useEffect, useCallback } from 'react';
import type { RaffleState } from '../types';
import TicketIcon from './icons/TicketIcon';

interface RaffleWidgetProps {
    raffleState: RaffleState;
    onJoin: () => void;
    isParticipant: boolean;
    isJoining: boolean;
}

const Countdown: React.FC<{ endTime: string }> = ({ endTime }) => {
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(endTime) - +new Date();
        let timeLeft = { m: 0, s: 0 };

        if (difference > 0) {
            timeLeft = {
                m: Math.floor((difference / 1000 / 60) % 60),
                s: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }, [endTime]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const format = (t: number) => t.toString().padStart(2, '0');

    return (
        <span className="font-mono font-bold">{`${format(timeLeft.m)}:${format(timeLeft.s)}`}</span>
    );
};

const RaffleWidget: React.FC<RaffleWidgetProps> = ({ raffleState, onJoin, isParticipant, isJoining }) => {
    return (
        <div className="absolute top-28 left-4 right-4 z-20 flex justify-center pointer-events-none animate-fade-in-fast">
            <div className="bg-gradient-to-r from-purple-800/80 to-indigo-800/80 backdrop-blur-md p-3 rounded-xl border border-purple-400/30 shadow-lg flex items-center gap-4 w-full max-w-sm pointer-events-auto">
                <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center shrink-0">
                    <TicketIcon className="w-7 h-7 text-yellow-900" />
                </div>
                <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">Sorteio: {raffleState.prize}</p>
                    <p className="text-xs text-gray-300">
                        <Countdown endTime={raffleState.endTime} /> restantes • {raffleState.participants.length} participantes
                    </p>
                </div>
                <button
                    onClick={onJoin}
                    disabled={isParticipant || isJoining}
                    className={`font-bold text-sm px-4 py-2 rounded-full transition-colors shrink-0 disabled:opacity-70 ${isParticipant ? 'bg-gray-600 text-gray-300' : 'bg-yellow-400 text-black'}`}
                >
                    {isJoining ? '...' : isParticipant ? 'Participando' : 'Participar'}
                </button>
            </div>
        </div>
    );
};

export default RaffleWidget;