

import React from 'react';

// Replaced with a gem icon to match the purchase screen design
const DiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 50 42" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M25 2L5 17L25 40L45 17L25 2Z" fill="#FDE047"/>
        <path d="M25 2L15 17L25 40L35 17L25 2Z" fill="#FACC15"/>
        <path d="M5 17L15 17L25 2L5 17Z" fill="#FEF08A"/>
        <path d="M45 17L35 17L25 2L45 17Z" fill="#FDE047"/>
        <path d="M15 17L25 40L5 17H15Z" fill="#FDE047"/>
        <path d="M35 17L25 40L45 17H35Z" fill="#FACC15"/>
    </svg>
);

export default DiamondIcon;