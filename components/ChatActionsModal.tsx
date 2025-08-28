import React from 'react';

interface ChatActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnfriend: () => void;
  onBlock: () => void;
  isFollowing: boolean;
}

const ChatActionsModal: React.FC<ChatActionsModalProps> = ({ isOpen, onClose, onUnfriend, onBlock, isFollowing }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-transparent flex items-end justify-center z-50 animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-[#1c1c1e] w-full max-w-md p-2 flex flex-col gap-2 animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#2c2c2e] rounded-xl">
            {isFollowing && (
                 <>
                    <button onClick={onUnfriend} className="w-full text-center p-3.5 text-red-500 text-lg">
                        Cancelar amizade
                    </button>
                    <div className="h-px bg-gray-600/50 mx-4"></div>
                 </>
            )}
            <button onClick={onBlock} className="w-full text-center p-3.5 text-red-500 text-lg">
                Bloquear
            </button>
        </div>
        <button onClick={onClose} className="w-full text-center p-3.5 bg-[#2c2c2e] rounded-xl text-sky-400 text-lg">
            Cancelar
        </button>
      </div>
    </div>
  );
};

export default ChatActionsModal;