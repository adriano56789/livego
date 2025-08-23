import React, { useState, useEffect, useCallback } from 'react';
import type { User, ConvitePK, PkBattle } from '../types';
import * as liveStreamService from '../services/liveStreamService';

interface PkInvitationModalProps {
  currentUser: User;
  opponent: User;
  onClose: () => void;
  invitation: ConvitePK;
  onInviteAccepted: (battle: PkBattle) => void;
}

const VsCrossedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="vsCrossedIconGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <g transform="translate(2, 2)">
        <path d="M12.35,16.2 L22,22 L12.35,27.8 L18.15,22 Z M31.65,16.2 L22,22 L31.65,27.8 L25.85,22 Z" fill="url(#vsCrossedIconGradient)" />
        <path d="M16.2,12.35 L22,22 L27.8,12.35 L22,18.15 Z M16.2,31.65 L22,22 L27.8,31.65 L22,25.85 Z" fill="url(#vsCrossedIconGradient)" />
        <path d="M13,31 L31,13" stroke="rgba(10, 5, 20, 0.4)" strokeWidth="4" strokeLinecap="round" />
    </g>
  </svg>
);


const PkInvitationModal: React.FC<PkInvitationModalProps> = ({ currentUser, opponent, onClose, invitation, onInviteAccepted }) => {

    useEffect(() => {
        if (!invitation || !invitation.id || invitation.status !== 'pendente') {
            return;
        }

        const intervalId = setInterval(async () => {
            try {
                const { invitation: updatedInvite, battle } = await liveStreamService.getPkInvitationStatus(invitation.id);

                if (updatedInvite.status === 'aceito' && battle) {
                    clearInterval(intervalId);
                    onInviteAccepted(battle);
                } else if (['recusado', 'cancelado', 'expirado'].includes(updatedInvite.status)) {
                    clearInterval(intervalId);
                    alert(`O convite foi ${updatedInvite.status}.`);
                    onClose();
                }
            } catch (error) {
                console.error("Error polling invitation status:", error);
                clearInterval(intervalId);
                onClose();
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(intervalId);
    }, [invitation, onInviteAccepted, onClose]);

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

    return (
        <div className="fixed inset-0 z-[70] bg-transparent flex flex-col items-center justify-end p-4 font-sans text-white" onClick={onClose}>
            <div 
                className="relative z-10 flex flex-col items-center bg-[#1c1c1e] rounded-2xl p-4 w-full max-w-md animate-slide-up-fast"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-center gap-4">
                    {/* Current User */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={currentUser.avatar_url} alt={currentUser.nickname || ''} className="w-20 h-20 rounded-full object-cover border-2 border-blue-400/50" />
                        <p className="font-semibold text-gray-200 truncate w-24 text-center">{currentUser.nickname}</p>
                    </div>

                    <VsCrossedIcon className="w-10 h-10 shrink-0 mx-2" />

                    {/* Opponent */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={opponent.avatar_url} alt={opponent.nickname || ''} className="w-20 h-20 rounded-full object-cover border-2 border-pink-400/50" />
                        <p className="font-semibold text-gray-200 truncate w-24 text-center">{opponent.nickname}</p>
                    </div>
                </div>

                <p className="text-base text-gray-200 mt-4 animate-pulse">
                    Aguardando resposta...
                </p>

                <button
                    onClick={handleCancelClick}
                    className="mt-6 w-full bg-black/50 border border-gray-600 font-semibold py-3 px-12 rounded-full transition-colors hover:bg-black/70"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default PkInvitationModal;