import React from 'react';

const ChestIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M52 20H12C9.79086 20 8 21.7909 8 24V48C8 50.2091 9.79086 52 12 52H52C54.2091 52 56 50.2091 56 48V24C56 21.7909 54.2091 20 52 20Z" fill="#854D0E" stroke="#FBBF24" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M8 28.6667C13.3333 23.3333 24 24 32 28.6667C40 33.3333 50.6667 34 56 28.6667" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M44 20C44 15.5817 40.4183 12 36 12H28C23.5817 12 20 15.5817 20 20" stroke="#A16207" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M36 32V40" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default ChestIcon;