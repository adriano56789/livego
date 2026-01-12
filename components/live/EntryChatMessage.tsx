
import React from 'react';
import { User, Streamer } from '../../types';

interface EntryChatMessageProps {
    user: User;
    currentUser: User;
    onClick: (user: User) => void;
    onFollow: (user: User) => void;
    isFollowed: boolean;
    streamer: Streamer;
}

const EntryChatMessage: React.FC<EntryChatMessageProps> = ({ user, onClick }) => {
    return (
        <div className="flex items-center space-x-2 my-1.5 px-2 py-1 bg-gradient-to-r from-purple-500/20 to-transparent rounded-l-full animate-in slide-in-from-right-4 fade-in">
            <div className="bg-purple-500 rounded-full px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Entrou
            </div>
            <span 
                className="text-purple-200 text-sm font-semibold cursor-pointer hover:text-white transition-colors"
                onClick={() => onClick(user)}
            >
                {user.name}
            </span>
            <span className="text-gray-400 text-xs">se juntou à live.</span>
        </div>
    );
};

export default EntryChatMessage;
