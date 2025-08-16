import React from 'react';

const CoinBIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
        <radialGradient id="goldCoinGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FBBF24" />
        </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#goldCoinGradient)" stroke="#DAA520" strokeWidth="1.5"/>
    <text x="50%" y="51%" dominantBaseline="central" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#854D0E" style={{ textShadow: '0px 1px 1px rgba(255, 255, 255, 0.5)' }}>G</text>
  </svg>
);

export default CoinBIcon;
