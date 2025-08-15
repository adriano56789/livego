import React from 'react';

const GoldCoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="gold-coin-grad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#FBBF24" />
      </radialGradient>
      <filter id="inner-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feComponentTransfer in="SourceAlpha">
          <feFuncA type="table" tableValues="1 0" />
        </feComponentTransfer>
        <feGaussianBlur stdDeviation="2" />
        <feOffset dx="0" dy="2" result="offsetblur" />
        <feFlood floodColor="#A16207" floodOpacity="0.5" result="color" />
        <feComposite in="color" in2="offsetblur" operator="in" />
        <feComposite in="SourceGraphic" operator="over" />
      </filter>
      <filter id="gold-coin-text-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="blur" />
        <feOffset in="blur" dx="0" dy="1" result="offsetBlur" />
        <feFlood floodColor="#FEF3C7" result="floodColor"/>
        <feComposite in="floodColor" in2="offsetBlur" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <circle cx="20" cy="20" r="20" fill="url(#gold-coin-grad)" />
    <circle cx="20" cy="20" r="18" stroke="#F59E0B" strokeWidth="2" filter="url(#inner-shadow)" />
    <text
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontSize="20"
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
      fill="#854D0E"
      dy=".1em"
      filter="url(#gold-coin-text-shadow)"
    >
      C
    </text>
  </svg>
);

export default GoldCoinIcon;
