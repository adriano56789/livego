import React from 'react';
import { 
    MagicIcon, MicIcon, MicOffIcon, 
    VolumeIcon, VolumeOffIcon, ShieldIcon, UserPlusIcon, CloseIcon, UserIcon,
    TrophyIcon, MessageIcon, SunIcon, BanIcon, EditIcon
} from './icons';

interface ToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenCoHostModal: (e: any) => void;
    isPKBattleActive: boolean;
    onStartPK?: (e: any) => void;
    onEndPKBattle?: (e: any) => void;
    onOpenBeautyPanel: (e: any) => void;
    onOpenPrivateChat: (e: any) => void;
    onOpenPrivateInviteModal: (e: any) => void;
    onOpenClarityPanel: (e: any) => void;
    onOpenRanking?: () => void;
    isModerationActive: boolean;
    onToggleModeration: (e: any) => void;
    isPrivateStream?: boolean;
    isMicrophoneMuted: boolean;
    onToggleMicrophone: (e: any) => void;
    isSoundMuted: boolean;
    onToggleSound: (e: any) => void;
    isAutoFollowEnabled: boolean;
    onToggleAutoFollow: (e: any) => void;
    isAutoPrivateInviteEnabled: boolean;
    onToggleAutoPrivateInvite: (e: any) => void;
    onOpenEditStreamInfo?: (e: any) => void;
}

const ToolItem = ({ icon: Icon, label, onClick, isActive = false, activeColor = "bg-green-500 text-white", defaultColor = "bg-[#2C2C2E] text-gray-400", hasDot = false }: any) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(e); }} 
        className="flex flex-col items-center gap-2 p-1 active:scale-95 transition-transform w-full"
    >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center relative transition-colors ${isActive ? activeColor : defaultColor}`}>
            <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-300'}`} />
            {hasDot && !isActive && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border-2 border-[#1C1C1E]"></div>
            )}
        </div>
        <span className="text-[11px] text-gray-300 text-center font-medium leading-tight">{label}</span>
    </button>
);

const ToolsModal: React.FC<ToolsModalProps> = ({ 
    isOpen, onClose, onOpenBeautyPanel, onOpenCoHostModal, 
    isMicrophoneMuted, onToggleMicrophone, isSoundMuted, onToggleSound,
    onOpenClarityPanel, onToggleModeration, isModerationActive,
    onOpenPrivateInviteModal, onStartPK, isPKBattleActive, onEndPKBattle, onToggleAutoFollow, isAutoFollowEnabled,
    onToggleAutoPrivateInvite, isAutoPrivateInviteEnabled, onOpenPrivateChat, onOpenEditStreamInfo, onOpenRanking
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-[1px]" onClick={onClose}>
            <div className="w-full bg-[#1C1C1E] rounded-t-2xl p-5 animate-in slide-in-from-bottom duration-300 pb-8 border-t border-white/5 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold text-base">Ferramentas</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><CloseIcon className="text-gray-400 w-5 h-5" /></button>
                </div>
                
                {/* Ferramentas de Interação */}
                <div className="mb-6">
                    <h4 className="text-gray-500 text-xs font-medium mb-4 px-1">Interação</h4>
                    <div className="grid grid-cols-4 gap-4">
                        <ToolItem icon={UserIcon} label="Co-host" onClick={onOpenCoHostModal} defaultColor="bg-[#2C2C2E] text-white" />
                        {isPKBattleActive ? (
                            <ToolItem icon={BanIcon} label="Encerrar PK" onClick={onEndPKBattle} defaultColor="bg-red-500/20 text-red-500" />
                        ) : (
                            <ToolItem icon={TrophyIcon} label="Batalha" onClick={onStartPK} defaultColor="bg-[#2C2C2E] text-white" />
                        )}
                        <ToolItem icon={UserPlusIcon} label="Convidar" onClick={onOpenPrivateInviteModal} defaultColor="bg-[#2C2C2E] text-white" />
                        <ToolItem icon={MessageIcon} label="Chat" onClick={onOpenPrivateChat} hasDot defaultColor="bg-[#2C2C2E] text-white" />
                    </div>
                </div>

                {/* Ferramentas de Âncora */}
                <div>
                    <h4 className="text-gray-500 text-xs font-medium mb-4 px-1">Âncora</h4>
                    <div className="grid grid-cols-4 gap-y-6 gap-x-4">
                        <ToolItem icon={MagicIcon} label="Embelezar" onClick={onOpenBeautyPanel} hasDot defaultColor="bg-[#2C2C2E] text-white" />
                        <ToolItem icon={!isMicrophoneMuted ? MicIcon : MicOffIcon} label="Microfone" isActive={!isMicrophoneMuted} activeColor="bg-green-500 text-white" onClick={onToggleMicrophone} />
                        <ToolItem icon={!isSoundMuted ? VolumeIcon : VolumeOffIcon} label="Som" isActive={!isSoundMuted} activeColor="bg-green-500 text-white" onClick={onToggleSound} />
                        <ToolItem icon={ShieldIcon} label="Moderar" isActive={isModerationActive} onClick={onToggleModeration} defaultColor="bg-[#2C2C2E] text-white" />
                        <ToolItem icon={SunIcon} label="Clareza" onClick={onOpenClarityPanel} defaultColor="bg-[#2C2C2E] text-white" />
                        <ToolItem icon={TrophyIcon} label="Ranking" onClick={onOpenRanking} defaultColor="bg-[#2C2C2E] text-white" />
                        <ToolItem icon={UserPlusIcon} label="Seguir Auto" isActive={isAutoFollowEnabled} onClick={onToggleAutoFollow} defaultColor="bg-[#2C2C2E] text-white" />
                        <ToolItem icon={UserPlusIcon} label="Auto Convite" isActive={isAutoPrivateInviteEnabled} onClick={onToggleAutoPrivateInvite} defaultColor="bg-[#2C2C2E] text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolsModal;
