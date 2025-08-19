import React from 'react';

const AudioVisualizer: React.FC = () => {
    return (
        <div className="flex items-end justify-center gap-0.5 w-4 h-4 text-green-400">
            <span className="w-0.5 h-full bg-current animate-audiowave" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-0.5 h-full bg-current animate-audiowave" style={{ animationDelay: '0.3s' }}></span>
            <span className="w-0.5 h-full bg-current animate-audiowave" style={{ animationDelay: '0s' }}></span>
            <span className="w-0.5 h-full bg-current animate-audiowave" style={{ animationDelay: '0.2s' }}></span>
        </div>
    );
};

export default AudioVisualizer;
