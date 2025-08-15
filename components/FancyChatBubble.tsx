
import React from 'react';

const FancyChatBubble: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // A decorative SVG element to mimic the leafy flourishes
    const Flourish: React.FC<{ className?: string }> = ({ className }) => (
        <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M2.52161 15.8972C-0.548942 12.045 -0.211833 6.27375 3.51893 3.03375C7.24968 -0.206249 12.8753 -0.563333 16.7972 2.50721C18.3283 3.69471 20.354 5.99221 21.054 7.39471C21.419 8.12221 22.0166 9.31721 21.7828 10.2222C21.1496 12.7872 17.9103 12.5534 15.6843 12.3847" stroke="url(#paint0_linear_101_2)" strokeWidth="2" strokeLinecap="round"/>
            <defs>
                <linearGradient id="paint0_linear_101_2" x1="2.0003" y1="1.99999" x2="20.73" y2="15.2015" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F472B6"/>
                    <stop offset="1" stopColor="#A78BFA"/>
                </linearGradient>
            </defs>
        </svg>
    );

    return (
        <div className="relative inline-block py-2 px-1">
            {/* Top-left flourish */}
            <div className="absolute top-0 left-0 z-0 transform -translate-y-1">
                <Flourish className="w-5 h-5 opacity-70" />
            </div>
            {/* Top-right flourish */}
            <div className="absolute top-0 right-0 z-0 transform scale-x-[-1] -translate-y-1">
                <Flourish className="w-5 h-5 opacity-70" />
            </div>
             {/* Bottom-left flourish */}
            <div className="absolute bottom-0 left-0 z-0 transform scale-y-[-1] translate-y-1">
                <Flourish className="w-4 h-4 opacity-50" />
            </div>
            {/* Bottom-right flourish */}
            <div className="absolute bottom-0 right-0 z-0 transform scale-x-[-1] scale-y-[-1] translate-y-1">
                <Flourish className="w-4 h-4 opacity-50" />
            </div>

            <div className="relative z-10 bg-gradient-to-r from-pink-600/70 to-purple-600/70 backdrop-blur-sm px-3 py-1.5 rounded-2xl border-2 border-purple-400/30">
                {children}
            </div>
        </div>
    );
};

export default FancyChatBubble;
