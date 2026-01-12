
import React, { useState, useRef, useEffect } from 'react';
import { User, ToastType, Obra } from '@/types';
import { 
    ChevronLeftIcon, EditIcon, MoreIcon, CopyIcon, 
    MarsIcon, VenusIcon, StarIcon, ChevronRightIcon, BrazilFlagIcon,
    CloseIcon
} from '@/components/icons';
import { LevelBadge } from '@/components/LevelBadge';
import { api } from '@/services/api';
import EditProfileScreen from '@/components/EditProfileScreen';

interface UserProfileDetailScreenProps {
    userToView: User;
    loggedInUser: User;
    onClose: () => void;
    onUpdateUser: (user: User) => void;
    onOpenFans: () => void;
    onOpenFollowing: () => void;
    onOpenTopFans: () => void;
    addToast: (type: ToastType, message: string) => void;
    onChat?: () => void;
    onFollow?: () => void;
}

const ModalWrapper = ({ children, onClose }: { children?: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center bg-transparent" onClick={onClose}>
        <div 
            className="w-full sm:max-w-md bg-[#1C1C1E] rounded-t-2xl sm:rounded-xl shadow-2xl animate-in slide-in-from-bottom duration-300 border border-white/5"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

const OptionsModal = ({ onClose, onBlock, onReport }: any) => {
    return (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-transparent" onClick={onClose}>
            <div className="w-full bg-[#1C1C1E] rounded-t-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-2xl pb-8" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col">
                    <button onClick={onBlock} className="w-full py-4 text-center text-[#ef4444] font-bold text-sm border-b border-white/5 hover:bg-white/5 active:bg-white/10 transition-colors">Bloquear</button>
                    <button onClick={onReport} className="w-full py-4 text-center text-white font-bold text-sm hover:bg-white/5 active:bg-white/10 transition-colors">Relatório</button>
                </div>
                <div className="h-2 bg-[#121212] w-full"></div>
                <button onClick={onClose} className="w-full py-4 bg-[#1C1C1E] text-center text-white font-bold text-sm hover:bg-white/5 active:bg-white/10 transition-colors">Cancelar</button>
            </div>
        </div>
    );
};

const ReportModal = ({ onClose, onReport }: { onClose: () => void, onReport: (reason: string) => void }) => {
    const reasons = ["Conteúdo sexualmente explícito", "Discurso de ódio", "Assédio ou bullying", "Violência perigosa", "Spam ou golpe", "Outro"];
    return (
        <ModalWrapper onClose={onClose}>
            <div className="pb-4">
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                    <h3 className="text-white font-bold">Relatar Usuário</h3>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="flex flex-col">
                    {reasons.map((reason, idx) => (
                        <button key={idx} onClick={() => onReport(reason)} className="text-left px-4 py-4 text-white text-sm border-b border-white/5 hover:bg-white/5 active:bg-white/10">{reason}</button>
                    ))}
                </div>
            </div>
        </ModalWrapper>
    );
};

export default function UserProfileDetailScreen({ userToView, loggedInUser, onClose, onUpdateUser, onOpenFans, onOpenFollowing, onOpenTopFans, onChat, onFollow, addToast }: UserProfileDetailScreenProps) {
    const [activeTab, setActiveTab] = useState<'obras' | 'curtidas' | 'detalhes'>('obras');
    const [showOptions, setShowOptions] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [userData, setUserData] = useState<User & { isFollowing?: boolean }>(userToView);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchUserData = async () => {
            try {
                const fetchedUser = await api.users.get(userToView.id);
                if (isMounted && fetchedUser) {
                    const isFollowing = loggedInUser.followingIds?.includes(fetchedUser.id);
                    setUserData({ ...fetchedUser, isFollowing });
                }
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchUserData();
        return () => { isMounted = false; };
    }, [userToView.id, loggedInUser.followingIds]);
    
    const handleSave = (updatedData: Partial<User>) => {
        const updatedUser = { ...userData, ...updatedData };
        setUserData(updatedUser);
        onUpdateUser(updatedUser);
        setIsEditing(false);
    };

    const handleCopyId = () => {
        if (userData?.identification) {
            navigator.clipboard.writeText(userData.identification);
            if (addToast) addToast(ToastType.Success, "ID copiado!");
        }
    };

    const handleFollowClick = () => {
        setUserData(prev => ({ ...prev, isFollowing: !prev.isFollowing, fans: (prev.fans || 0) + (prev.isFollowing ? -1 : 1) }));
        if (onFollow) onFollow();
    };
    
    const handleBlock = async () => {
        setShowOptions(false);
        try {
            await api.users.blockUser(userData.id);
            if(addToast) addToast(ToastType.Success, `${userData.name} bloqueado.`);
            onClose();
        } catch (e) {
            if(addToast) addToast(ToastType.Error, `Falha ao bloquear ${userData.name}.`);
        }
    }

    const handleReport = (reason: string) => {
        setShowReportModal(false);
        addToast(ToastType.Success, `Denúncia sobre "${reason}" enviada. Agradecemos sua colaboração.`);
    };

    const canEdit = userToView.id === loggedInUser.id;

    if (isEditing) {
        return (
            <EditProfileScreen
                user={userData}
                onClose={() => setIsEditing(false)}
                onSave={handleSave}
                addToast={addToast}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <div 
                className="w-full h-full bg-[#121212] flex flex-col relative outline-none overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="h-40 w-full relative shrink-0">
                    <img 
                        src={userData.coverUrl || "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=2070&auto=format&fit=crop"} 
                        className="w-full h-full object-cover opacity-60" 
                        alt="Cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#121212]"></div>
                    
                    <div className="absolute top-4 left-4 z-10">
                        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full hover:bg-black/50 transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                    </div>
                    <div className="absolute top-4 right-4 z-10 flex gap-3">
                        {canEdit && (
                             <button onClick={() => setIsEditing(true)} className="w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full hover:bg-black/50 transition-colors">
                                <EditIcon className="w-5 h-5 text-white" />
                            </button>
                        )}
                        <button onClick={() => setShowOptions(true)} className="w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full hover:bg-black/50 transition-colors">
                            <MoreIcon className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <div className="w-24 h-24 rounded-full p-[3px] bg-[#121212] relative shadow-xl">
                            <img 
                                src={userData.avatarUrl} 
                                alt={userData.name} 
                                className="w-full h-full rounded-full object-cover border-2 border-[#2C2C2E]"
                            />
                            <div className="absolute bottom-1 right-0 w-5 h-3.5 rounded-[2px] overflow-hidden border border-white/20 shadow-md">
                                <BrazilFlagIcon className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`flex-1 bg-[#121212] pt-12 overflow-y-auto scrollbar-hide ${onFollow ? 'pb-24' : 'pb-4'}`}>
                    <div className="flex flex-col items-center px-4">
                        <h2 className="text-xl font-bold text-white mb-1 tracking-wide">{userData.name}</h2>
                        
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                            <span>Identificação: {userData.identification}</span>
                            <button onClick={handleCopyId} className="active:scale-95"><CopyIcon className="w-3 h-3" /></button>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <div className={`flex items-center px-2 py-0.5 rounded-full gap-1 min-w-[36px] justify-center ${userData.gender === 'female' ? 'bg-[#3b82f6]' : 'bg-[#3b82f6]'}`}>
                                {userData.gender === 'female' ? <VenusIcon className="w-2.5 h-2.5 text-white" /> : <MarsIcon className="w-2.5 h-2.5 text-white" />}
                                <span className="text-[10px] font-bold text-white">{userData.age || 25}</span>
                            </div>
                            <div className="flex items-center bg-[#a855f7] px-2 py-0.5 rounded-full gap-1 min-w-[36px] justify-center">
                                <StarIcon className="w-2.5 h-2.5 text-white fill-white" />
                                <span className="text-[10px] font-bold text-white">{userData.level || 1}</span>
                            </div>
                        </div>

                        <div className="text-gray-500 text-xs mb-6 font-medium">
                            Brasil | {userData.location || 'desconhecido'}
                        </div>

                        <div className="flex justify-around w-full px-2 mb-6">
                            <div className="flex flex-col items-center cursor-pointer" onClick={onOpenFans}>
                                <span className="text-white font-bold text-base mb-0.5">{userData.fans || 0}</span>
                                <span className="text-gray-400 text-[11px]">Fãs</span>
                            </div>
                            <div className="flex flex-col items-center cursor-pointer" onClick={onOpenFollowing}>
                                <span className="text-white font-bold text-base mb-0.5">{userData.following || 0}</span>
                                <span className="text-gray-400 text-[11px]">Seguindo</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-white font-bold text-base mb-0.5">{userData.receptores || 0}</span>
                                <span className="text-gray-400 text-[11px]">Receptores</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-white font-bold text-base mb-0.5">{userData.enviados || 0}</span>
                                <span className="text-gray-400 text-[11px]">Enviados</span>
                            </div>
                        </div>

                        <button 
                            onClick={onOpenTopFans}
                            className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 flex justify-between items-center mb-6 active:bg-[#2C2C2E] transition-colors border border-white/5"
                        >
                            <span className="text-white font-bold text-sm">Principais fãs</span>
                            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex items-center border-b border-white/10 px-4 mt-2 sticky top-0 bg-[#121212] z-10">
                        <button 
                            onClick={() => setActiveTab('obras')}
                            className={`flex-1 py-3 text-sm font-bold relative transition-colors ${activeTab === 'obras' ? 'text-white' : 'text-gray-500'}`}
                        >
                            Obras
                            {activeTab === 'obras' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#a855f7] rounded-full shadow-[0_0_10px_#a855f7]"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('curtidas')}
                            className={`flex-1 py-3 text-sm font-bold relative transition-colors ${activeTab === 'curtidas' ? 'text-white' : 'text-gray-500'}`}
                        >
                            Curtidas
                            {activeTab === 'curtidas' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#a855f7] rounded-full shadow-[0_0_10px_#a855f7]"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('detalhes')}
                            className={`flex-1 py-3 text-sm font-bold relative transition-colors ${activeTab === 'detalhes' ? 'text-white' : 'text-gray-500'}`}
                        >
                            Detalhes
                            {activeTab === 'detalhes' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#a855f7] rounded-full shadow-[0_0_10px_#a855f7]"></div>}
                        </button>
                    </div>

                    <div className="pb-4 min-h-[300px]">
                        {activeTab === 'obras' && (
                            (userData.obras && userData.obras.length > 0) ? (
                                <div className="grid grid-cols-3 gap-1 p-1">
                                    {userData.obras.map(obra => (
                                        <div key={obra.id} className="aspect-square bg-gray-800">
                                            <img src={obra.url} alt="obra" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <p className="text-sm">Nenhuma obra ainda.</p>
                                </div>
                            )
                        )}
                        {activeTab === 'curtidas' && (
                            (userData.curtidas && userData.curtidas.length > 0) ? (
                                <div className="grid grid-cols-3 gap-1 p-1">
                                    {(userData.curtidas as Obra[]).map(likedItem => (
                                        <div key={likedItem.id} className="aspect-square bg-gray-800">
                                            <img src={likedItem.url} alt="curtida" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <p className="text-xs">Este usuário manteve as curtidas privadas.</p>
                                </div>
                            )
                        )}
                        {activeTab === 'detalhes' && (
                            <div className="p-4 space-y-4">
                                <div className="bg-[#1C1C1E] rounded-xl p-5 space-y-4 border border-white/5">
                                    <h3 className="text-white font-bold text-sm mb-2">Informações Básicas</h3>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-gray-500">ID</span>
                                        <span className="text-gray-300 font-medium">{userData.identification}</span>
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-gray-500">Nível</span>
                                        <span className="text-gray-300 font-medium">Nv. {userData.level}</span>
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-gray-500">Entrou em</span>
                                        <span className="text-gray-300 font-medium">{userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('pt-BR') : 'Não definido'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {onFollow && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-[#121212] border-t border-white/5 flex gap-4 z-20">
                        <button 
                            onClick={handleFollowClick}
                            className={`flex-1 py-3.5 rounded-full font-bold text-sm transition-colors shadow-lg ${userData.isFollowing ? 'bg-gray-700 text-white' : 'bg-[#8B5CF6] text-white'}`}
                        >
                            {userData.isFollowing ? 'Seguindo' : 'Seguir'}
                        </button>
                        {onChat && (
                            <button 
                                onClick={onChat}
                                className="flex-1 py-3.5 rounded-full font-bold text-sm bg-[#8B5CF6] text-white hover:bg-[#7c3aed] transition-colors shadow-lg"
                            >
                                Conversar
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {showOptions && <OptionsModal onClose={() => setShowOptions(false)} onBlock={handleBlock} onReport={() => { setShowOptions(false); setShowReportModal(true); }} />}
            {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} onReport={handleReport} />}
        </div>
    )
}
