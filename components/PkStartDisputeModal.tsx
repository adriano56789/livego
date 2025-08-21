import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import PkBlobsIcon from './icons/PkBlobsIcon';

interface PkStartDisputeModalProps {
    currentUser: User;
    onClose: () => void;
    onProposeDispute: (opponent: User) => Promise<void>;
}

const PkStartDisputeModal: React.FC<PkStartDisputeModalProps> = ({ currentUser, onClose, onProposeDispute }) => {
    const [opponents, setOpponents] = useState<User[]>([]);
    const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchOpponents = async () => {
            setIsLoading(true);
            try {
                const potentialOpponents = await liveStreamService.getCoHostFriends(currentUser.id);
                setOpponents(potentialOpponents);
                if (potentialOpponents.length > 0) {
                    const defaultOpponent = potentialOpponents.find(p => p.id !== currentUser.id) || potentialOpponents[0];
                    setSelectedOpponent(defaultOpponent);
                }
            } catch (err) {
                console.error("Error fetching opponents:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOpponents();
    }, [currentUser.id]);

    const handleStartClick = async () => {
        if (selectedOpponent) {
            setIsSubmitting(true);
            await onProposeDispute(selectedOpponent);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end" onClick={onClose}>
            <div
                className="bg-white w-full rounded-t-2xl p-4 pt-6 text-black animate-slide-up-fast flex flex-col gap-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-2">
                    <div className="w-6 h-6"></div> {/* Spacer */}
                    <h2 className="text-center font-bold text-lg">Iniciar disputa</h2>
                    <button>
                        <QuestionMarkIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando oponentes...</div>
                ) : selectedOpponent ? (
                    <div className="relative p-3 rounded-xl bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50">
                        <div className="flex items-center justify-center gap-4">
                             <div className="flex-1 text-right font-semibold truncate">{currentUser.nickname}</div>
                             <img src={currentUser.avatar_url} alt={currentUser.nickname || ''} className="w-12 h-12 rounded-full object-cover shrink-0"/>
                             <div className="shrink-0">
                                <PkBlobsIcon />
                             </div>
                             <img src={selectedOpponent.avatar_url} alt={selectedOpponent.nickname || ''} className="w-12 h-12 rounded-full object-cover shrink-0"/>
                             <div className="flex-1 text-left font-semibold truncate">{selectedOpponent.nickname}</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">Nenhum amigo online para a disputa.</div>
                )}
                
                {opponents.length > 0 && (
                    <button className="text-center text-sm text-gray-500 font-semibold py-1 hover:text-black">
                        Todos os Presentes &gt;
                    </button>
                )}

                <div className="mt-2">
                    <button
                        onClick={handleStartClick}
                        disabled={!selectedOpponent || isSubmitting || isLoading}
                        className="w-full py-3.5 rounded-full font-bold text-white bg-pink-500 hover:bg-pink-600 transition-colors disabled:opacity-70"
                    >
                        {isSubmitting ? 'Iniciando...' : 'Iniciar disputa'}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
                `}</style>
        </div>
    );
};

export default PkStartDisputeModal;
