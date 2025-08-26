import React from 'react';
import AudioVisualizer from './AudioVisualizer';

interface LiveBadgeProps {
  onClick?: () => void;
}

const LiveBadge: React.FC<LiveBadgeProps> = ({ onClick }) => {
    const Tag = onClick ? 'button' : 'div';

    return (
        <Tag
            onClick={onClick}
            className={`flex items-center gap-2 bg-pink-500/80 backdrop-blur-sm text-white font-bold px-3 py-1.5 rounded-full text-sm shrink-0 ${onClick ? 'cursor-pointer hover:bg-pink-600/80' : ''} transition-colors shadow-lg`}
            aria-label="Entrar na transmissão ao vivo"
        >
            <AudioVisualizer colorClassName="text-white" />
            <span>LIVE</span>
        </Tag>
    );
};

export default LiveBadge;