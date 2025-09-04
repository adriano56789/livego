
import React from 'react';

const JordanaBadgeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <div className="relative w-10 h-6 shrink-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-purple-600 rounded-full blur-sm opacity-50"></div>
        <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-full flex items-center justify-center px-2 border border-purple-400/50">
            <span className="font-bold text-sm text-white drop-shadow-md">55</span>
        </div>
        {/* Ornaments */}
        <div className="absolute -top-1.5 -left-1 text-xs text-yellow-300">👑</div>
        <div className="absolute -bottom-1 -right-0.5 text-xs transform -scale-x-100">🦋</div>
    </div>
);

export default JordanaBadgeIcon;
