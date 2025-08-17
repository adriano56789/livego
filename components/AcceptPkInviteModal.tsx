import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { PkInvitation, User } from '../types';

const CountdownCircle: React.FC<{ timeLeft: number; totalDuration: number }> = ({ timeLeft, totalDuration }) => {
    // Ensure totalDuration is not zero to avoid division by zero
    const progress = totalDuration > 0 ? Math.max(0, timeLeft / totalDuration) : 0;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <svg className="w-20 h-20 transform -rotate-90">
            <circle
                className="text-white/20"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="40"
                cy="40"
            />
            <circle
                className="text-white"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="40"
                cy="40"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
        </svg>
    );
};


interface AcceptPkInviteModalProps {
  currentUser: User;
  invitation: PkInvitation;
  onAccept: () => void;
  onDecline: () => void;
}

const AcceptPkInviteModal: React.FC<AcceptPkInviteModalProps> = ({ currentUser, invitation, onAccept, onDecline }) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = +new Date(invitation.data_expiracao) - +new Date();
    return difference > 0 ? Math.floor(difference / 1000) : 0;
  }, [invitation.data_expiracao]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isAccepting, setIsAccepting] = useState(false);
  
  const totalDuration = useMemo(() => {
    const duration = (+new Date(invitation.data_expiracao) - +new Date(invitation.data_envio)) / 1000;
    return duration > 0 ? duration : 300; // Default to 5 minutes if invalid
  }, [invitation.data_expiracao, invitation.data_envio]);


  useEffect(() => {
    if (isAccepting) return; // Stop timer if we are processing the acceptance
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (remaining <= 0) {
        clearInterval(timer);
        onDecline();
      }
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, onDecline, isAccepting]);
  
  const handleAcceptClick = () => {
    setIsAccepting(true);
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in-fast">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-red-900 opacity-50"></div>
        <div className="relative bg-black/40 p-6 flex flex-col items-center text-center">
            
            <p className="text-sm font-semibold text-gray-300 mb-2">DESAFIO DE BATALHA PK</p>
            
            <div className="flex items-center justify-center w-full my-4">
                <div className="flex flex-col items-center w-2/5">
                    <img src={invitation.inviterAvatarUrl} alt={invitation.inviterName} className="w-20 h-20 rounded-full object-cover border-2 border-blue-400" />
                    <p className="font-bold text-white mt-2 truncate w-full">{invitation.inviterName}</p>
                </div>
                
                <div className="w-1/5">
                     <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-red-500 drop-shadow-lg">VS</span>
                </div>
                
                <div className="flex flex-col items-center w-2/5">
                    <img src={currentUser.avatar_url} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover border-2 border-red-400" />
                    <p className="font-bold text-white mt-2 truncate w-full">{currentUser.nickname || currentUser.name}</p>
                </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 -m-1 pointer-events-none">
                         <CountdownCircle timeLeft={timeLeft} totalDuration={totalDuration} />
                    </div>
                    <button
                        onClick={handleAcceptClick}
                        disabled={isAccepting}
                        className="relative z-10 w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex flex-col items-center justify-center shadow-lg shadow-red-500/30 transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isAccepting ? (
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <span className="font-bold text-base">ACEITAR</span>
                                <span className="font-semibold text-xl">{timeLeft}s</span>
                            </>
                        )}
                    </button>
                </div>
                 <button onClick={onDecline} className="text-gray-400 font-semibold text-sm">Recusar</button>
            </div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-fast { 
            from { opacity: 0; transform: scale(0.95); } 
            to { opacity: 1; transform: scale(1); } 
        }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AcceptPkInviteModal;
