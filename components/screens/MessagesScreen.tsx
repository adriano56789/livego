
import React, { useState, useEffect } from 'react';
import { MessageSquare, UserPlus, Search } from 'lucide-react';
import PrivateChatScreen from './PrivateChatScreen';
import { User, ToastType } from '@/types';
import { api } from '@/services/api';
import { LoadingSpinner } from '@/components/Loading';

interface MessagesScreenProps {
    addToast: (type: ToastType, message: string) => void;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ addToast }) => {
    const [activeTab, setActiveTab] = useState<'Chat' | 'Amigos'>('Chat');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [friends, setFriends] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

    const loadMessagesData = async () => {
        console.log("%c[MESSAGES] Iniciar renderização", "color: #3b82f6; font-weight: bold");
        setIsLoading(true);
        try {
            console.log("%c[MESSAGES] Construir - Requisitando Mocha API", "color: #3b82f6");
            const [convs, friendsList, online] = await Promise.all([
                api.chats.listConversations(),
                api.users.getFriends('me'),
                api.users.getOnlineUsers('global')
            ]);
            
            setConversations(Array.isArray(convs) ? convs : []);
            setFriends(Array.isArray(friendsList) ? friendsList : []);
            setOnlineUsers(Array.isArray(online) ? online : []);
            console.log("%c[MESSAGES] Fim da renderização - Dados sincronizados", "color: #3b82f6; font-weight: bold");
        } catch (err) {
            console.error("[Mocha Error] Falha ao carregar mensagens:", err);
            setConversations([]);
            setFriends([]);
            setOnlineUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMessagesData();
    }, [activeTab]);

    const handleBlockUser = async (userToBlock: User) => {
        try {
            const result = await api.users.blockUser(userToBlock.id);
            if (result.success) {
                addToast(ToastType.Success, `${userToBlock.name} bloqueado com sucesso.`);
                setSelectedUser(null); // Fecha a tela de chat
            }
        } catch (e: any) {
            console.error("Failed to block user", e);
            addToast(ToastType.Error, e.message || `Falha ao bloquear ${userToBlock.name}.`);
        }
    };

    if (selectedUser) {
        return <PrivateChatScreen user={selectedUser} onClose={() => { setSelectedUser(null); loadMessagesData(); }} onBlock={handleBlockUser} variant="page" addToast={addToast} />;
    }

    return (
        <div className="h-full bg-[#121212] text-white flex flex-col font-sans select-none animate-in fade-in duration-300">
            {/* Header Tabs */}
            <div className="pt-12 pb-2 px-4 bg-[#121212]">
                <div className="flex justify-center items-center relative">
                    <div className="flex items-center space-x-12">
                        <button onClick={() => setActiveTab('Chat')} className={`text-[17px] font-black pb-3 relative transition-all ${activeTab === 'Chat' ? 'text-white scale-105' : 'text-gray-500'}`}>
                            Chat
                            {activeTab === 'Chat' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>}
                        </button>
                        <button onClick={() => setActiveTab('Amigos')} className={`text-[17px] font-black pb-3 relative transition-all ${activeTab === 'Amigos' ? 'text-white scale-105' : 'text-gray-500'}`}>
                            Amigos
                             {activeTab === 'Amigos' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Seletor Horizontal de Usuários (MOCHA API) */}
            <div className="px-4 py-4 bg-black/20 border-b border-white/5 shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic tracking-tighter">Online agora (via Mocha):</span>
                </div>
                
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                    {onlineUsers.length > 0 ? (
                        onlineUsers.map(user => (
                            <button 
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className="flex flex-col items-center gap-1 shrink-0 active:scale-90 transition-transform"
                            >
                                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-purple-600 to-pink-600 shadow-lg shadow-purple-900/20">
                                    <img 
                                        src={user.avatarUrl} 
                                        className="w-full h-full rounded-full object-cover border-2 border-[#121212]" 
                                        alt={user.name} 
                                    />
                                </div>
                                <span className="text-[10px] font-bold truncate w-14 text-center text-gray-300">
                                    {user.name.split(' ')[0]}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="flex items-center gap-3 opacity-30 px-2 py-2">
                             <div className="w-12 h-12 rounded-full bg-white/5 border border-dashed border-white/20"></div>
                             <span className="text-[10px] font-black uppercase tracking-tighter">Ninguém online</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#121212] no-scrollbar">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <LoadingSpinner />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Buscando no Mocha API...</span>
                    </div>
                ) : activeTab === 'Chat' ? (
                    <div className="w-full text-left p-2 space-y-1">
                        {conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center pt-20 text-center opacity-60">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare size={32} className="text-gray-600" />
                                </div>
                                <h3 className="text-white font-bold text-sm mb-1">Nenhuma conversa ativa</h3>
                                <p className="text-xs text-gray-500">Inicie um papo com os usuários online.</p>
                            </div>
                        ) : (
                            conversations.map((conv: any) => (
                                <div key={conv.id} onClick={() => setSelectedUser(conv.friend)} className="flex items-center p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all active:scale-[0.98]">
                                    <div className="relative">
                                        <div className="w-14 h-14 bg-gray-800 rounded-full overflow-hidden border border-white/10 shadow-lg p-[1px]">
                                            <img src={conv.friend.avatarUrl} alt={conv.friend.name} className="w-full h-full rounded-full object-cover" />
                                        </div>
                                        {conv.friend.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00E676] rounded-full border-[3px] border-[#121212]"></div>}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-black text-[15px] text-white tracking-wide">{conv.friend.name}</h3>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">{conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                        </div>
                                        <p className="text-gray-400 text-xs truncate max-w-[200px] font-medium">{conv.lastMessage}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="p-2">
                        <div className="px-4 py-3 mb-2 flex justify-between items-center">
                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Amigos Sincronizados ({friends.length})</span>
                            <UserPlus size={14} className="text-gray-600" />
                        </div>
                        {friends.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40 mt-10">
                                <UserPlus size={48} className="mb-4 mx-auto" />
                                <p className="text-sm font-bold text-white">Nenhum amigo encontrado no banco.</p>
                            </div>
                        ) : (
                            friends.map(friend => (
                                <div key={friend.id} onClick={() => setSelectedUser(friend)} className="flex items-center p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all mb-1 active:scale-[0.98]">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-md">
                                            <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-1 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <h3 className="font-black text-sm text-white">{friend.name}</h3>
                                            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-tighter">Nível: {friend.level}</span>
                                        </div>
                                        <button className="bg-purple-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wider shadow-lg shadow-purple-900/20">Chat</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesScreen;
