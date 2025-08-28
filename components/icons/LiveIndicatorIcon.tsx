import React from 'react';

const LiveIndicatorIcon: React.FC = () => (
    <div className="flex items-end gap-0.5 w-4 h-3">
        <span className="w-0.5 h-full bg-white animate-audiowave" style={{ animationDelay: '0.2s' }}></span>
        <span className="w-0.5 h-full bg-white animate-audiowave" style={{ animationDelay: '0s' }}></span>
        <span className="w-0.5 h-full bg-white animate-audiowave" style={{ animationDelay: '0.4s' }}></span>
    </div>
);

export default LiveIndicatorIcon;
