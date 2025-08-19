

import React, { useState, useEffect } from 'react';
import type { User, ConvitePK } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import CrossIcon from './icons/CrossIcon';
import SparkleIcon from './icons/SparkleIcon';
import PkBlobsIcon from './icons/PkBlobsIcon';

interface PkStartDisputeModalProps {
    mode: 'propose' | 'waiting';
    currentUser: User;
    invitation?: ConvitePK | null;
    onClose: () => void;
    onProposeDispute?: (opponent: User) => Promise<void>;
    onCancelDispute?: () => void;
}

const PkStartDisputeModal: React.FC<PkStartDisputeModalProps> = ({
    mode,
    currentUser,
    invitation,
    onClose,
    onProposeDispute,
    onCancelDispute
}) => {
    const [opponent, setOpponent] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchOpponent = async () => {
            setIsLoading(true);
            try {
                if (mode === 'propose') {
                    // For simulation, set the opponent to the current user
                    setOpponent(currentUser);
                } else if (mode === 'waiting' && invitation) {
                    const opponentId = invitation.destinatario_id === currentUser.id ? invitation.remetente_id : invitation.destinatario_id;
                    const opponentUser = await authService.getUserProfile(opponentId);
                    setOpponent(opponentUser);
                }
            } catch (err) {
                console.error("Error fetching opponent for dispute modal:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOpponent();
    }, [mode, currentUser, invitation]);
    
    const handleAction = async () => {
        if (mode === 'propose' && onProposeDispute && opponent) {
            setIsSubmitting(true);
            await onProposeDispute(opponent);
            // Parent component will change mode, which will re-render this modal.
        } else if (mode === 'waiting' && onCancelDispute) {
            onCancelDispute();
        }
    };
    
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[80] bg-black/50 flex items-end">
                <div className="bg-white w-full rounded-t-2xl p-4 pt-6 text-black h-[40vh] flex items-center justify-center">
                    Carregando...
                </div>
            </div>
        )
    }

    if (mode === 'propose') {
         return (
            <div className="fixed inset-0 z-[80] bg-black/50 flex items-end" onClick={onClose}>
              <div 
                className="bg-white w-full rounded-t-2xl p-4 pt-6 text-black animate-slide-up-fast flex flex-col gap-4" 
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-center font-bold text-lg">Convite para disputa</h2>
                
                {opponent ? (
                    <div className="relative p-3 rounded-xl bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50">
                      <div className="flex items-center justify-between">
                        {/* Current User (Inviter) */}
                        <div className="flex items-center gap-2">
                          <SparkleIcon className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-semibold">{currentUser.nickname}</span>
                          <img src={currentUser.avatar_url} alt={currentUser.nickname || ''} className="w-12 h-12 rounded-full object-cover"/>
                        </div>
                        
                        {/* Opponent (Invitee) */}
                        <div className="flex items-center gap-2">
                          <img src={opponent.avatar_url} alt={opponent.nickname || ''} className="w-12 h-12 rounded-full object-cover"/>
                          <span className="text-sm font-semibold">{opponent.nickname}</span>
                        </div>
                      </div>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                         <PkBlobsIcon />
                      </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">Não foi possível encontrar um oponente.</div>
                )}

                <div className="flex items-center justify-around mt-2">
                    <button onClick={onClose} className="flex-1 py-3.5 font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                        Recusar
                    </button>
                    <button 
                        onClick={handleAction} 
                        disabled={!opponent || isSubmitting} 
                        className="flex-[2] py-3.5 rounded-full font-bold text-white bg-pink-500 hover:bg-pink-600 transition-colors disabled:opacity-70"
                    >
                        {isSubmitting ? 'Enviando...' : 'Aceitar'}
                    </button>
                </div>
              </div>
               <style>{`
                @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
                `}</style>
            </div>
        );
    }


    // WAITING MODE
    return (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end" onClick={onClose}>
            <div
                className="bg-white w-full rounded-t-2xl p-4 pt-6 text-black animate-slide-up-fast relative"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4"><CrossIcon className="w-6 h-6 text-gray-400" /></button>
                <h2 className="text-center font-bold text-lg mb-4">Convite Enviado</h2>

                <div className="flex items-center justify-center p-3 bg-gray-100 rounded-xl">
                    <div className="flex-1 flex flex-col items-center text-center">
                        <img src={currentUser.avatar_url} alt={currentUser.nickname || ''} className="w-14 h-14 rounded-full object-cover" />
                        <p className="font-semibold mt-2 text-sm truncate w-full">{currentUser.nickname}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="https://storage.googleapis.com/genai-assets/pk_invite_vs.png" alt="vs" className="w-full h-full" />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center text-center">
                       <img src={opponent?.avatar_url} alt={opponent?.nickname || ''} className="w-14 h-14 rounded-full object-cover" />
                       <p className="font-semibold mt-2 text-sm truncate w-full">{opponent?.nickname}</p>
                    </div>
                </div>
                
                <p className="text-sm text-gray-600 font-semibold w-full text-center py-3 animate-pulse">
                    Aguardando oponente aceitar...
                </p>

                <div className="mt-2">
                    <button
                        onClick={handleAction}
                        className="w-full py-3.5 rounded-full font-bold text-white transition-colors bg-gray-500 hover:bg-gray-600"
                    >
                        Cancelar
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
