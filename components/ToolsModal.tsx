import React from 'react';
import { 
    CloseIcon,
    UserPlusIcon,
    BattleIcon,
    SparklesIcon,
    MicrophoneIcon,
    SunIcon,
    ChatBubbleIcon,
    SettingsIcon,
    MicrophoneOffIcon,
    SoundOnIcon,
    SoundOffIcon
} from './icons';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCoHostModal: (e: React.MouseEvent) => void;
  onOpenPrivateInviteModal: (e: React.MouseEvent) => void;
  isPKBattleActive?: boolean;
  onEndPKBattle?: (e: React.MouseEvent) => void;
  onOpenBeautyPanel?: (e: React.MouseEvent) => void;
  onOpenPrivateChat?: (e: React.MouseEvent) => void;
  onOpenClarityPanel?: (e: React.MouseEvent) => void;
  isModerationActive?: boolean;
  onToggleModeration?: (e: React.MouseEvent) => void;
  isPrivateStream?: boolean;
  isMicrophoneMuted?: boolean;
  onToggleMicrophone?: (e: React.MouseEvent) => void;
  isSoundMuted?: boolean;
  onToggleSound?: (e: React.MouseEvent) => void;
  isAutoFollowEnabled?: boolean;
  onToggleAutoFollow?: (e: React.MouseEvent) => void;
  isAutoPrivateInviteEnabled?: boolean;
  onToggleAutoPrivateInvite?: (e: React.MouseEvent) => void;
}

interface ToolButtonProps {
    icon: React.ReactNode;
    label: string;
    hasDot?: boolean;
    isActive?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, hasDot, isActive, onClick, disabled }) => (
    <div className="flex flex-col items-center space-y-2 text-center w-20">
        <button onClick={onClick} disabled={disabled} className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'} disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed`}>
            {icon}
            {hasDot && <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-[#1C1C1E]"></div>}
        </button>
        <span className="text-xs text-gray-300">{label}</span>
    </div>
);

const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose, onOpenCoHostModal, onOpenPrivateInviteModal, isPKBattleActive, onEndPKBattle, onOpenBeautyPanel, onOpenPrivateChat, onOpenClarityPanel, isModerationActive, onToggleModeration, isPrivateStream, isMicrophoneMuted, onToggleMicrophone, isSoundMuted, onToggleSound, isAutoFollowEnabled, onToggleAutoFollow, isAutoPrivateInviteEnabled, onToggleAutoPrivateInvite }) => {
    
    const createAndCloseHandler = (action?: (e: React.MouseEvent) => void) => {
        if (!action) return undefined;
        return (e: React.MouseEvent) => {
            e.stopPropagation();
            action(e);
            // Do not close for toggle actions that just change state
            if (action !== onToggleModeration && action !== onToggleMicrophone && action !== onToggleSound && action !== onToggleAutoFollow && action !== onToggleAutoPrivateInvite) {
                onClose();
            }
        };
    };

    const cohostTools = [
        { icon: <UserPlusIcon className="w-7 h-7 text-white" />, label: 'Co-host', hasDot: false, onClick: createAndCloseHandler(onOpenCoHostModal) },
        { icon: <BattleIcon className="w-7 h-7 text-white" />, label: isPKBattleActive ? 'Fim da Batalha' : 'Batalha', hasDot: false, onClick: createAndCloseHandler(isPKBattleActive ? onEndPKBattle : onOpenCoHostModal) },
        { icon: <UserPlusIcon className="w-7 h-7 text-white" />, label: 'Convidar', hasDot: false, onClick: createAndCloseHandler(onOpenPrivateInviteModal) },
    ];

    const anchorTools = [
        { icon: <SparklesIcon className="w-7 h-7 text-white" />, label: 'Embelezar', hasDot: true, onClick: createAndCloseHandler(onOpenBeautyPanel) },
        { icon: isMicrophoneMuted ? <MicrophoneOffIcon className="w-7 h-7 text-white" /> : <MicrophoneIcon className="w-7 h-7 text-white" />, label: 'Microfone', hasDot: false, isActive: !isMicrophoneMuted, onClick: onToggleMicrophone },
        { icon: isSoundMuted ? <SoundOffIcon className="w-7 h-7 text-white" /> : <SoundOnIcon className="w-7 h-7 text-white" />, label: 'Som', hasDot: false, isActive: !isSoundMuted, onClick: onToggleSound },
        { icon: <SettingsIcon className="w-7 h-7 text-white" />, label: 'Moderar', hasDot: false, isActive: isModerationActive, onClick: onToggleModeration },
        { icon: <SunIcon className="w-7 h-7 text-white" />, label: 'Clareza', hasDot: false, onClick: createAndCloseHandler(onOpenClarityPanel) },
        { icon: <ChatBubbleIcon className="w-7 h-7 text-white" />, label: 'Chat', hasDot: true, onClick: createAndCloseHandler(onOpenPrivateChat) },
        { icon: <UserPlusIcon className="w-7 h-7 text-white" />, label: 'Seguir Auto', hasDot: false, isActive: isAutoFollowEnabled, onClick: onToggleAutoFollow },
        { icon: <UserPlusIcon className="w-7 h-7 text-white" />, label: 'Auto Convite', hasDot: false, isActive: isAutoPrivateInviteEnabled, onClick: onToggleAutoPrivateInvite },
    ];

    return (
        <div 
          className={`absolute inset-0 z-40 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
        >
            <div
                className={`bg-[#1C1C1E] w-full max-w-md rounded-t-2xl p-4 space-y-4 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Ferramentas</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="bg-[#111111]/50 p-3 rounded-xl">
                    <h3 className="text-sm text-gray-400 mb-3 px-1">Ferramentas de Interação</h3>
                    <div className="flex items-center justify-center space-x-4">
                        {cohostTools.map(tool => <ToolButton key={tool.label} {...tool} />)}
                    </div>
                </div>

                <div className="bg-[#111111]/50 p-3 rounded-xl">
                    <h3 className="text-sm text-gray-400 mb-3 px-1">Ferramentas de âncora</h3>
                     <div className="flex flex-wrap items-center justify-around gap-y-4">
                        {anchorTools.map(tool => <ToolButton key={tool.label} {...tool} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolsModal;