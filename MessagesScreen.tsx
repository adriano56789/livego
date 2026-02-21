import React, { useState } from 'react';
import { Conversation, User } from '../types';
import { useTranslation } from '../i18n';

interface MessagesScreenProps {
  onStartChat: (friend: User) => void;
  onViewProfile: (friend: User) => void;
  conversations: Conversation[];
  friends: User[];
}

const LevelBadge: React.FC<{ level: number }> = ({ level }) => (
    <span className="bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center">
        ♀ {level}
    </span>
);

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => (
    <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center">
        🔥 {rank}
    </span>
);

interface ConversationItemProps {
    conversation: Conversation;
    onStartChat: (user: User) => void;
    onViewProfile: (user: User) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onStartChat, onViewProfile }) => (
    <div className="flex items-center p-4 space-x-4 cursor-pointer hover:bg-gray-800/50" onClick={() => onStartChat(conversation.friend)}>
        <button onClick={(e) => { e.stopPropagation(); onViewProfile(conversation.friend); }} className="flex-shrink-0 focus:outline-none rounded-full">
            <img src={conversation.friend.avatarUrl} alt={conversation.friend.name} className="w-14 h-14 rounded-full object-cover" />
        </button>
        <div className="flex-grow">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white">{conversation.friend.name}</h3>
                <span className="text-xs text-gray-500">{conversation.timestamp}</span>
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
                <LevelBadge level={conversation.friend.level} />
                {conversation.friend.rank && <RankBadge rank={conversation.friend.rank} />}
            </div>
            <p className="text-sm text-gray-400 mt-1 truncate">{conversation.lastMessage}</p>
        </div>
    </div>
);

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
                <button onClick={(e) => { e.stopPropagation(); onViewProfile(friend); }} className="flex-shrink-0 focus:outline-none rounded-full">
                    <img src={friend.avatarUrl} alt={friend.name} className="w-14 h-14 rounded-full object-cover" />
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

const MessagesScreen: React.FC<MessagesScreenProps> = ({ onStartChat, onViewProfile, conversations, friends }) => {
    const [activeTab, setActiveTab] = useState<'messages' | 'friends'>('messages');
    const { t } = useTranslation();

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
                        {conversations.map(convo => (
                            <ConversationItem key={convo.id} conversation={convo} onStartChat={onStartChat} onViewProfile={onViewProfile} />
                        ))}
                    </div>
                ) : (
                    <div>
                         {friends.map(friend => (
                            <FriendItem key={friend.id} friend={friend} onStartChat={onStartChat} onViewProfile={onViewProfile} />
                        ))}
                    </div>
                )}
                 { (activeTab === 'messages' && conversations.length === 0) || (activeTab === 'friends' && friends.length === 0) ? (
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
