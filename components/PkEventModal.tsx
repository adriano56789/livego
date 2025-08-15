import React, { useState, useEffect } from 'react';
import type { PkEventDetails, PkEventStreamer } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import PkRankBadge from './PkRankBadge';
import PkLevelBadge from './PkLevelBadge';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface PkEventModalProps {
  onClose: () => void;
  onUserClick: (userId: number) => void;
}

const formatScore = (num: number) => num.toLocaleString('en-US');

const Countdown: React.FC<{ endTime: string }> = ({ endTime }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endTime) - +new Date();
        let timeLeft = { d: 0, h: 0, m: 0, s: 0 };

        if (difference > 0) {
            timeLeft = {
                d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                m: Math.floor((difference / 1000 / 60) % 60),
                s: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const format = (t: number) => t.toString().padStart(2, '0');

    return (
        <span className="font-mono text-sm tracking-wider">
            {`${format(timeLeft.d)}D ${format(timeLeft.h)}:${format(timeLeft.m)}:${format(timeLeft.s)}`}
        </span>
    );
};


const PkEventModal: React.FC<PkEventModalProps> = ({ onClose, onUserClick }) => {
    const [activeTab, setActiveTab] = useState<'streamers' | 'users'>('streamers');
    const [eventDetails, setEventDetails] = useState<PkEventDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showApiResponse } = useApiViewer();

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const data = await liveStreamService.getPkRankingInfo();
                setEventDetails(data);
                showApiResponse('GET /api/pk-event/details', data);
            } catch (error) {
                console.error("Failed to load PK event details", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [showApiResponse]);

    const StreamerRow: React.FC<{ streamer: PkEventStreamer }> = ({ streamer }) => (
        <button onClick={() => onUserClick(streamer.userId)} className="flex items-center w-full px-2 py-2 hover:bg-white/10 rounded-lg">
            <div className="w-12 text-center flex flex-col items-center">
                {streamer.rank <= 3 ? (
                    <PkRankBadge rank={streamer.rank} />
                ) : (
                    <span className="font-bold text-gray-300">{streamer.rank}</span>
                )}
            </div>
            <div className="flex-1 flex items-center gap-3">
                <img src={streamer.avatarUrl} alt={streamer.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                    <p className="font-semibold text-white">{streamer.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                        {streamer.badges.map((badge, i) => <PkLevelBadge key={i} badge={badge} />)}
                    </div>
                </div>
            </div>
            <div className="font-bold text-white">{formatScore(streamer.score)}</div>
        </button>
    );

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (!eventDetails) {
            return <div className="flex-grow flex items-center justify-center text-gray-400">Não foi possível carregar os detalhes do evento.</div>;
        }

        return (
            <div className="flex-grow flex flex-col">
                <div className="text-center py-3 bg-black/20 rounded-lg">
                    <p className="text-xs text-blue-200 font-semibold">Prêmio Total de Presentes PK</p>
                    <p className="text-3xl font-bold text-white my-1">{eventDetails.totalPrize.toLocaleString('en-US', { minimumFractionDigits: 2 })}<span className="text-lg text-gray-300 ml-1">USD</span></p>
                    <div className="text-xs text-gray-300">Termina em: <Countdown endTime={eventDetails.endTime} /></div>
                </div>

                <div className="flex items-center text-sm text-gray-400 font-semibold py-2 px-2 mt-2">
                    <p className="w-12 text-center">Posição</p>
                    <p className="flex-1 ml-3">Streamer</p>
                    <p>PK</p>
                </div>
                
                <div className="flex-grow overflow-y-auto space-y-1">
                    {activeTab === 'streamers' ? (
                        eventDetails.streamerRanking.map(s => <StreamerRow key={s.userId} streamer={s} />)
                    ) : (
                        <div className="text-center text-gray-500 pt-10">Ranking de usuários não implementado.</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white flex flex-col font-sans animate-fade-in-fast">
             {/* Header */}
             <header className="flex items-center justify-between p-4 shrink-0">
                <button onClick={onClose} className="bg-black/20 p-2 rounded-full">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex-grow"></div>
                <button className="flex items-center gap-2 text-sm bg-black/20 px-3 py-1.5 rounded-full">
                    <span>Semana anterior</span>
                    <span className="text-gray-400">&gt;</span>
                </button>
             </header>

             <main className="flex-grow flex flex-col px-4 pb-4 overflow-hidden">
                {/* Banner */}
                <div className="relative text-center my-2">
                     <img src="https://storage.googleapis.com/genai-assets/PK_Event_Banner.png" alt="Evento de PK Banner" className="w-full h-auto" />
                     <button className="absolute top-2 right-2 bg-black/30 p-1.5 rounded-full"><QuestionMarkIcon className="w-4 h-4 text-white"/></button>
                </div>
                
                {/* Tabs */}
                <div className="shrink-0 flex items-center justify-center p-1 bg-black/20 rounded-full my-2">
                    <button onClick={() => setActiveTab('streamers')} className={`w-1/2 py-2 rounded-full text-sm font-bold ${activeTab === 'streamers' ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}`}>
                        Ranking de Streamers
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-1/2 py-2 rounded-full text-sm font-bold ${activeTab === 'users' ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'text-gray-400'}`}>
                        Ranking de Usuários
                    </button>
                </div>
                
                {renderContent()}
             </main>

            <style>{`
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default PkEventModal;