import React from 'react';

const GiftBasketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M3.5 10H20.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
        <path d="M6 10L8 20H16L18 10" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.5 6C9.5 4.34315 10.6193 3 12 3C13.3807 3 14.5 4.34315 14.5 6" stroke="#FB923C" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export default GiftBasketIcon;