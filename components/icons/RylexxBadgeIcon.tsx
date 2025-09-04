
import React from 'react';

const RylexxBadgeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-orange-500 rounded-full blur-sm opacity-50"></div>
        <div className="relative w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center border border-orange-300/50">
            <span className="font-bold text-sm text-white drop-shadow-md">2</span>
        </div>
    </div>
);

export default RylexxBadgeIcon;
