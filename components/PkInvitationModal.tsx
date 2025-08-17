import React, { useState, useEffect, useCallback } from 'react';
import type { User, ConvitePK } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import SwordsIcon from './icons/SwordsIcon';

interface PkInvitationModalProps {
  currentUser: User;
  opponent: User;
  onInviteSent: (invitation: ConvitePK) => void;
  onClose: () => void;
  invitation: ConvitePK | null;
}

const PkInvitationModal: React.FC<PkInvitationModalProps> = ({ currentUser, opponent, onInviteSent, onClose, invitation }) => {
    const [isSending, setIsSending] = useState(false);
    const isWaitingForResponse = !!invitation;

    const handleInvite = useCallback(async () => {
        if (isSending || isWaitingForResponse) return;
        setIsSending(true);
        try {
            const newInvitation = await liveStreamService.sendPkInvitation(currentUser.id, opponent.id);
            onInviteSent(newInvitation);
        } catch (err) {
            alert(`Falha ao enviar convite: ${err instanceof Error ? err.message : 'Tente novamente.'}`);
            onClose(); // Close on failure to invite
        } finally {
            setIsSending(false);
        }
    }, [isSending, isWaitingForResponse, currentUser.id, opponent.id, onInviteSent, onClose]);
    
    useEffect(() => {
        if (!isWaitingForResponse) {
            handleInvite();
        }
    }, [isWaitingForResponse, handleInvite]);
    
    const handleCancelClick = async () => {
        if (!invitation) {
            onClose();
            return;
        }
        try {
            await liveStreamService.cancelPkInvitation(invitation.id);
        } catch (error) {
            console.error("Failed to cancel invitation", error);
        } finally {
            onClose();
        }
    }

    const statusText = isSending 
        ? `Convidando ${opponent.nickname}...` 
        : isWaitingForResponse 
        ? "Aguardando resposta" 
        : "Enviando convite...";

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center font-sans text-white p-8 animate-fade-in-fast">
            <div className="flex items-center justify-center gap-8 w-full">
                {/* Inviter Avatar */}
                <div className="flex flex-col items-center gap-2">
                    <img src={currentUser.avatar_url} alt={currentUser.nickname || ''} className="w-24 h-24 rounded-full object-cover border-4 border-blue-500/50" />
                    <p className="font-semibold text-gray-300 truncate w-24 text-center">{currentUser.nickname}</p>
                </div>

                <SwordsIcon className="w-12 h-12 text-red-500 shrink-0" />

                {/* Opponent Avatar */}
                <div className="flex flex-col items-center gap-2">
                    <img src={opponent.avatar_url} alt={opponent.nickname || ''} className="w-24 h-24 rounded-full object-cover border-4 border-pink-500/50" />
                     <p className="font-semibold text-gray-300 truncate w-24 text-center">{opponent.nickname}</p>
                </div>
            </div>

            <p className="text-lg text-gray-200 mt-8">
                {statusText}
                {isWaitingForResponse && <span className="animate-dots"></span>}
            </p>

            <button
                onClick={handleCancelClick}
                className="mt-16 bg-white/10 border border-white/20 font-semibold py-3 px-12 rounded-full transition-colors hover:bg-white/20"
            >
                Cancelar
            </button>
            
             <style>{`
                @keyframes fade-in-fast { 
                    from { opacity: 0; } 
                    to { opacity: 1; } 
                }
                .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
                
                @keyframes dots {
                    0%, 20% { content: '.'; }
                    40%, 60% { content: '..'; }
                    80%, 100% { content: '...'; }
                }
                .animate-dots::after {
                    display: inline-block;
                    animation: dots 1.5s infinite;
                    content: '';
                    width: 20px; /* give some space */
                    text-align: left;
                }
             `}</style>
        </div>
    );
};

export default PkInvitationModal;
