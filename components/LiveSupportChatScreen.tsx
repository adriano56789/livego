
import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, ConversationMessage, User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface LiveSupportChatScreenProps {
  user: User;
  onExit: () => void;
}

const ChatBubble: React.FC<{ message: ConversationMessage; isSender: boolean }> = ({ message, isSender }) => {
  const bubbleClass = isSender
    ? 'bg-green-600 self-end rounded-br-none'
    : 'bg-[#373738] self-start rounded-bl-none';

  return (
    <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${bubbleClass}`}>
      <p className="text-white">{message.text}</p>
    </div>
  );
};

const LiveSupportChatScreen: React.FC<LiveSupportChatScreenProps> = ({ user, onExit }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversation = async () => {
      setIsLoading(true);
      try {
        const convo = await liveStreamService.getSupportConversation(user.id);
        setConversation(convo);
      } catch (error) {
        console.error("Failed to load support conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversation();
  }, [user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [(conversation?.messages || []).length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || isSending) return;
    
    const messageToSend = newMessage;
    setNewMessage('');
    setIsSending(true);

    try {
        const updatedConversation = await liveStreamService.sendMessageToSupport(user.id, messageToSend);
        setConversation(updatedConversation);
    } catch(error) {
        console.error("Failed to send message", error);
        alert("Erro ao enviar mensagem.");
        setNewMessage(messageToSend); // Restore message on failure
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#121212] flex flex-col text-white font-sans">
      <header className="p-4 flex items-center justify-between bg-[#1c1c1c] border-b border-gray-800 shrink-0">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <div className="flex flex-col items-center">
            <h1 className="font-semibold">{conversation?.otherUserName || 'Suporte'}</h1>
        </div>
        <div className="w-6"></div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto flex flex-col gap-3">
        {isLoading ? (
             <div className="flex-grow flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : (conversation?.messages || []).map(msg => (
          <ChatBubble key={msg.id} message={msg} isSender={msg.senderId === user.id} />
        ))}
         <div ref={messagesEndRef} />
      </main>

      <footer className="p-2 bg-[#1c1c1c] shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-grow h-10 bg-[#373738] rounded-full px-4 text-sm placeholder-gray-400 focus:outline-none"
            />
            <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="bg-green-500 text-black font-semibold px-6 py-2 rounded-full disabled:opacity-50"
            >
                {isSending ? 'Enviando...' : 'Enviar'}
            </button>
        </form>
      </footer>
    </div>
  );
};

export default LiveSupportChatScreen;
