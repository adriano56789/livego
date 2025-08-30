
import React, { useState, useEffect } from 'react';
import type { User, AppView, Conversation } from '../types';
import { getConversations, getFriends } from '../services/authService';
import * as liveStreamService from '../services/liveStreamService';
import SearchIcon from './icons/SearchIcon';
import PlusIcon from './icons/PlusIcon';
import ConversationListItem from './ConversationListItem';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import UserListRow from './UserListRow';
import MessageIcon from './icons/MessageIcon';

interface MessagesScreenProps {
  user: User;
  onNavigate: (view: AppView) => void;
  onNavigateToChat: (userId: number) => void;
  onViewProfile: (userId: number) => void;
  onUpdateUser: (user: User) => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className="relative pb-3">
        <span className={`text-xl font-bold transition-colors ${active ? 'text-white' : 'text-gray-500'}`}>{children}</span>
        {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>}
    </button>
);


const MessagesScreen: React.FC<MessagesScreenProps> = ({ user, onNavigate, onNavigateToChat, onViewProfile, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'friends'>('messages');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [friends, setFriends] = useState<User[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const convos = await getConversations(user.id);
      setConversations(convos);
    } catch (err) {
      setError("Não foi possível carregar as mensagens.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchFriends = async () => {
    setIsFriendsLoading(true);
    try {
        const friendsData = await getFriends(user.id);
        setFriends(friendsData);
    } catch (err) {
        console.error(err);
        setError("Não foi possível carregar os amigos.");
    } finally {
        setIsFriendsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
        fetchConversations();
    } else if (activeTab === 'friends') {
        fetchFriends();
    }
  }, [user.id, activeTab]);

  const handleUnfriend = async (friendId: number) => {
    if (window.confirm(`Deixar de seguir ${friends.find(f => f.id === friendId)?.nickname}? Isto irá desfazer a amizade.`)) {
      try {
        const updatedUser = await liveStreamService.unfollowUser(user.id, friendId);
        onUpdateUser(updatedUser);
        setFriends(prev => prev.filter(f => f.id !== friendId));
      } catch (error) {
        console.error("Unfollow failed:", error);
        alert("Não foi possível deixar de seguir.");
      }
    }
  };

  const renderMessagesList = () => {
    if (isLoading) {
      return <div className="text-center text-gray-400 pt-10">Carregando conversas...</div>;
    }
    if (error) {
      return <div className="text-center text-red-400 pt-10">{error}</div>;
    }
    if (conversations.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 px-4 h-full">
            <MessageIcon className="w-20 h-20 mb-4 opacity-30" />
            <h2 className="text-xl font-bold text-gray-300">Nenhuma mensagem</h2>
            <p className="mt-2">Suas conversas com outros usuários aparecerão aqui.</p>
        </div>
      );
    }
    return (
        <div className="divide-y divide-gray-800">
        {conversations.map(convo => {
          if (convo.type === 'friend_requests_summary') {
            return (
              <button key={convo.id} onClick={() => onNavigate('friend-requests')} className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <div className="relative shrink-0 w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <UserPlusIcon className="w-8 h-8 text-blue-400" />
                  {convo.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-[#121212]">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-grow overflow-hidden">
                    <h2 className="font-semibold text-white truncate">{convo.otherUserName}</h2>
                    <p className={`truncate text-sm ${convo.unreadCount > 0 ? 'text-gray-300' : 'text-gray-500'}`}>{convo.messages[0]?.text || 'Veja seus pedidos de amizade'}</p>
                </div>
              </button>
            )
          }
          return (
            <ConversationListItem 
              key={convo.id} 
              conversation={convo} 
              onClick={() => onNavigateToChat(convo.otherUserId)}
            />
          )
        })}
      </div>
    );
  };

  const renderFriendsList = () => {
    if (isFriendsLoading) {
      return <div className="text-center text-gray-400 pt-10">Carregando amigos...</div>;
    }
    if (friends.length === 0) {
      return <div className="text-center text-gray-500 pt-10">Nenhum amigo encontrado. Siga alguém de volta para fazer amigos.</div>;
    }
    return (
        <div className="divide-y divide-gray-800">
        {friends.map(friend => (
            <UserListRow
                key={friend.id}
                user={friend}
                currentUser={user}
                onFollowToggle={() => handleUnfriend(friend.id)}
                onUserClick={() => onViewProfile(friend.id)}
                onAvatarClick={() => onNavigateToChat(friend.id)}
            />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#121212] text-white h-full flex flex-col font-sans">
      <header className="px-4 pt-6 pb-3 flex items-center justify-between shrink-0 bg-[#1c1c1c] border-b border-gray-800 relative">
        <button onClick={() => onNavigate('feed')} className="z-10">
          <ArrowLeftIcon className="w-6 h-6"/>
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
            <TabButton active={activeTab === 'messages'} onClick={() => setActiveTab('messages')}>Mensagens</TabButton>
            <TabButton active={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>Amigos</TabButton>
        </div>
        <div className="flex items-center gap-4 z-10">
            <button onClick={() => onNavigate('search')}><SearchIcon className="w-6 h-6"/></button>
            <button onClick={() => alert('Nova mensagem não implementado')}><PlusIcon className="w-6 h-6"/></button>
        </div>
      </header>
      <main className="flex-grow overflow-y-auto scrollbar-hide">
        {activeTab === 'messages' ? renderMessagesList() : renderFriendsList()}
      </main>
    </div>
  );
};

export default MessagesScreen;