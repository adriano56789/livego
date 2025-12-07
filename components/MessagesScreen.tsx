import React, { useState, useEffect } from 'react';
import { Conversation, User } from '../types';
import { useTranslation } from '../i18n';
import { FriendRequestListIcon, MaleIcon, FemaleIcon, RankIcon } from './icons';

interface MessagesScreenProps {
  onStartChat: (friend: User) => void;
  onViewProfile: (friend: User) => void;
  conversations: Conversation[];
  friends: User[];
  initialTab?: 'messages' | 'friends';
  onOpenFriendRequests: () => void;
  fans: User[];
  followingUsers: User[];
}

const AgeBadge: React.FC<{ user: User }> = ({ user }) => (
    <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center space-x-1 ${user.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
        {user.gender === 'male' ? <MaleIcon className="h-3 w-3" /> : <FemaleIcon className="h-3 w-3" />}
        <span>{user.age}</span>
    </span>
);

const LevelBadge: React.FC<{ level: number }> = ({ level }) => (
    <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center space-x-1">
        <RankIcon className="h-3 w-3" />
        <span>{level}</span>
    </span>
);


interface ConversationItemProps {
    conversation: Conversation;
    onStartChat: (user: User) => void;
    onViewProfile: (user: User) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onStartChat, onViewProfile }) => (
    <div className="flex items-center p-4 space-x-4 cursor-pointer hover:bg-gray-800/50" onClick={() => onStartChat(conversation.friend)}>
        <button onClick={(e) => { e.stopPropagation(); onViewProfile(conversation.friend); }} className="relative flex-shrink-0 focus:outline-none rounded-full">
            <img src={conversation.friend.avatarUrl} alt={conversation.friend.name} className="w-14 h-14 rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
            {conversation.friend.isOnline && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-[#111111]"></div>
            )}
        </button>
        <div className="flex-grow min-w-0">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white truncate">{conversation.friend.name}</h3>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{conversation.timestamp}</span>
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
                {conversation.friend.age && <AgeBadge user={conversation.friend} />}
                <LevelBadge level={conversation.friend.level} />
            </div>
            <p className="text-sm text-gray-400 mt-1 truncate">{conversation.lastMessage}</p>
        </div>
    </div>
);

const FriendRequestSummaryItem: React.FC<{ latestRequest: User | null; onClick: () => void; }> = ({ latestRequest, onClick }) => {
    const date = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    return (
        <div className="flex items-center p-4 space-x-4 cursor-pointer hover:bg-gray-800/50" onClick={onClick}>
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <FriendRequestListIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-white">Pedido de amizade</h3>
                    <span className="text-xs text-gray-500">{formattedDate}</span>
                </div>
                {latestRequest ? (
                    <p className="text-sm text-gray-400 mt-1 truncate">Você seguiu @{latestRequest.name}.</p>
                ) : (
                    <p className="text-sm text-gray-400 mt-1 truncate">Veja seus pedidos de amizade.</p>
                )}
            </div>
        </div>
    );
};

interface FriendItemProps {
    friend: User;
    onStartChat: (user: User) => void;
    onViewProfile: (user: User) => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, onStartChat, onViewProfile }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50" onClick={() => onStartChat(friend)}>
            <div className="flex items-center space-x-4">
                <button onClick={(e) => { e.stopPropagation(); onViewProfile(friend); }} className="relative flex-shrink-0 focus:outline-none rounded-full">
                    <img src={friend.avatarUrl} alt={friend.name} className="w-14 h-14 rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
                    {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-[#111111]"></div>
                    )}
                </button>
                <div>
                    <h3 className="font-semibold text-white">{friend.name}</h3>
                    <p className="text-sm text-gray-400">{t('profile.id')}: {friend.identification}</p>
                </div>
            </div>
            {friend.isFollowed && (
                 <button className="bg-gray-700 text-gray-300 text-sm font-semibold px-4 py-1.5 rounded-full">
                    {t('common.followed')}
                </button>
            )}
        </div>
    );
};

const MessagesScreen: React.FC<MessagesScreenProps> = ({ onStartChat, onViewProfile, conversations, friends, initialTab, onOpenFriendRequests, fans, followingUsers }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'messages');
    const { t } = useTranslation();

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const fanIds = new Set(fans.map(f => f.id));
    const outgoingRequests = followingUsers.filter(followed => !fanIds.has(followed.id));
    const latestOutgoingRequest = outgoingRequests.length > 0 ? outgoingRequests[outgoingRequests.length - 1] : null;

    return (
        <div className="h-full flex flex-col bg-[#111111] text-white">
            <header className="flex-shrink-0">
                <nav className="flex items-center justify-center p-2">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('messages')}
                            className={`text-lg font-bold transition-colors ${activeTab === 'messages' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                            {t('footer.message')}
                            {activeTab === 'messages' && <div className="h-0.5 bg-white mt-1 rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`text-lg font-bold transition-colors ${activeTab === 'friends' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                            {t('common.friends')}
                             {activeTab === 'friends' && <div className="h-0.5 bg-white mt-1 rounded-full"></div>}
                        </button>
                    </div>
                </nav>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar pb-24">
                {activeTab === 'messages' ? (
                    <div>
                        {outgoingRequests.length > 0 && (
                            <FriendRequestSummaryItem latestRequest={latestOutgoingRequest} onClick={onOpenFriendRequests} />
                        )}

                        {conversations.length > 0 && conversations.map(convo => (
                            <ConversationItem key={convo.id} conversation={convo} onStartChat={onStartChat} onViewProfile={onViewProfile} />
                        ))}
                        
                        {conversations.length === 0 && friends.length > 0 && (
                            <>
                                <div className="p-3 text-sm text-gray-400 font-semibold bg-black/50">
                                    Comece uma nova conversa
                                </div>
                                {friends.map(friend => (
                                    <FriendItem key={friend.id} friend={friend} onStartChat={onStartChat} onViewProfile={onViewProfile} />
                                ))}
                            </>
                        )}
                    </div>
                ) : (
                    <div>
                         {friends.map(friend => (
                            <FriendItem key={friend.id} friend={friend} onStartChat={onStartChat} onViewProfile={onViewProfile} />
                        ))}
                    </div>
                )}

                 { (activeTab === 'messages' && conversations.length === 0 && outgoingRequests.length === 0 && friends.length === 0) || (activeTab === 'friends' && friends.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                        <p>Nenhum item aqui.</p>
                        <p className="text-sm">Comece a conversar com pessoas!</p>
                    </div>
                ) : null}
            </main>
        </div>
    );
};

export default MessagesScreen;