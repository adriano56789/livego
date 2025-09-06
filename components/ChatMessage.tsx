import React from 'react';
import type { ChatMessage } from '../types';
import { Player } from '@lottiefiles/react-lottie-player';
import FancyChatBubble from './FancyChatBubble';
import ProfileBadge from './ProfileBadge';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';
import DiamondIcon from './icons/DiamondIcon';
import TicketIcon from './icons/TicketIcon';
import TrophyIcon from './icons/TrophyIcon';

interface ChatMessageItemProps {
  message: ChatMessage;
  onUserClick: (userId: number) => void;
  isPkMode?: boolean;
}

// FIX: Completed the component to handle all message types and added a default export.
const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onUserClick, isPkMode }) => {

  if (message.type === 'entry') {
    return (
      <div className="p-1 self-start animate-slide-in-bottom">
        <span className="bg-black/40 rounded-full py-1.5 px-3 text-xs text-gray-300">
          <button onClick={() => onUserClick(message.userId)} className="font-semibold text-white truncate max-w-[100px] mr-1">{message.username}</button>
          entrou
        </span>
      </div>
    );
  }

  if (message.type === 'special_entry') {
    return (
        <div className="text-center py-1 self-center animate-fade-in-fast text-sm">
            <FancyChatBubble>
                <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">Bem-vindo </span>
                    <button onClick={() => onUserClick(message.userId)} className="font-bold text-yellow-300">{message.username}</button>
                    <span className="text-white">à sala!</span>
                </div>
            </FancyChatBubble>
        </div>
    )
  }

  if (message.type === 'raffle_start') {
    return (
      <div className="my-1 self-center animate-fade-in-fast text-sm w-full flex justify-center">
        <div className="bg-gradient-to-r from-yellow-600/50 to-amber-700/50 backdrop-blur-sm p-2 rounded-xl border-2 border-amber-400/30 flex items-center gap-3 text-white">
          <TicketIcon className="w-8 h-8 text-yellow-300 shrink-0" />
          <div className="text-left">
            <p className="font-bold">Sorteio iniciado!</p>
            <p className="text-xs text-yellow-200">Prêmio: {message.prize}. Duração: {message.durationMinutes} min. Participe agora!</p>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'raffle_win') {
    return (
      <div className="my-1 self-center animate-fade-in-fast text-sm w-full flex justify-center">
        <div className="bg-gradient-to-r from-purple-700/50 to-indigo-800/50 backdrop-blur-sm p-2 rounded-xl border-2 border-purple-400/30 flex items-center gap-3 text-white">
          <TrophyIcon className="w-8 h-8 text-yellow-300 shrink-0" />
          <div className="text-left">
            <p className="font-bold">O sorteio de "{message.prize}" terminou!</p>
            <p className="text-xs text-purple-200">Parabéns aos vencedores: {message.winners?.map(w => w.username).join(', ')}!</p>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'gift' || message.type === 'gift_roulette_win') {
    const giftName = message.giftName || 'um presente';
    const isRouletteWin = message.type === 'gift_roulette_win';
    
    return (
        <div className="py-1 self-start my-1 w-full flex justify-start">
             <FancyChatBubble>
                <div className="flex items-center gap-2 text-sm">
                    <button onClick={() => onUserClick(message.userId)} className="font-semibold text-yellow-300 truncate max-w-[100px]">{message.username}</button>
                    <span className="text-white">{isRouletteWin ? 'ganhou' : 'enviou'}</span>
                    {message.giftImageUrl && <img src={message.giftImageUrl} alt={giftName} className="w-6 h-6 object-contain" />}
                    <span className="font-semibold text-yellow-300 truncate max-w-[100px]">{giftName}</span>
                    {message.quantity && message.quantity > 1 && <span className="font-bold text-white">x{message.quantity}</span>}
                     {message.prizeAmount && (
                         <span className="flex items-center gap-1 font-bold text-yellow-300">
                             <DiamondIcon className="w-4 h-4" /> {message.prizeAmount.toLocaleString()}
                         </span>
                     )}
                </div>
            </FancyChatBubble>
        </div>
    );
  }
  
  if (message.type === 'announcement' || message.type === 'roulette_result') {
      return (
          <div className="text-center py-1 self-center animate-fade-in-fast text-sm">
               <FancyChatBubble>
                  <div className="flex items-center gap-2">
                      <span className="text-yellow-300 font-bold">{message.message}</span>
                  </div>
              </FancyChatBubble>
          </div>
      );
  }

  if (message.type === 'levelup') {
      return (
           <div className="text-center py-1 self-center animate-fade-in-fast text-sm">
               <FancyChatBubble>
                  <div className="flex items-center gap-2">
                      <span className="text-white">Parabéns a</span>
                      <button onClick={() => onUserClick(message.userId)} className="font-bold text-yellow-300">{message.username}</button>
                      <span className="text-white">por alcançar o nível {message.globalLevel}!</span>
                  </div>
              </FancyChatBubble>
          </div>
      )
  }

  // Default 'message' and 'image' types
  const BubbleContent = () => {
      if (message.type === 'image' && message.imageUrl) {
          return <img src={message.imageUrl} alt="imagem enviada" className="max-w-[200px] max-h-[200px] rounded-lg object-cover" />;
      }
      return <p className="text-white text-sm break-words">{message.message}</p>;
  };
  
  return (
    <div className={`p-1 flex gap-2.5 self-start w-full max-w-[85%]`}>
        <button onClick={() => onUserClick(message.userId)} className="w-9 h-9 rounded-full overflow-hidden shrink-0 self-start">
            {message.avatarUrl ? (
                <img src={message.avatarUrl} alt={message.username} className="w-full h-full object-cover" />
            ) : (
                <UserPlaceholderIcon className="w-full h-full text-gray-500 bg-gray-800" />
            )}
        </button>
        <div className="flex flex-col items-start">
             <div className="flex items-center gap-2">
                 <p className="text-xs text-gray-400 px-1">{message.username}</p>
                 {message.globalLevel && (
                    <ProfileBadge badge={{ text: String(message.globalLevel), type: 'level' }}/>
                 )}
                 {message.streamLevel && (
                    <ProfileBadge badge={{ text: String(message.streamLevel), type: 'level2', icon: 'leaf' }}/>
                 )}
            </div>
            <div className={`relative mt-1 rounded-lg py-2 px-3 text-left ${isPkMode ? 'bg-gray-800/60' : 'bg-black/40'}`}>
                <BubbleContent />
            </div>
        </div>
    </div>
  );
};

export default ChatMessageItem;