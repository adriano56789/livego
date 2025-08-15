import React from 'react';

const ButterflyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M10.75 3.924c-.426.15-1.076.15-1.502 0l-4.5 1.5A.75.75 0 004 6.136V13.5a.75.75 0 001.24.59L10 10.6l4.76 3.49a.75.75 0 001.24-.59V6.136a.75.75 0 00-.75-.712l-4.5-1.5z" />
        <path d="M4.75 8.5V13.25a.75.75 0 001.238.592L10 10.422l-4.012-2.508a.75.75 0 00-.988.336.75.75 0 00.25.95zM15.25 8.5v4.75a.75.75 0 01-1.238.592L10 10.422l4.012-2.508a.75.75 0 01.988.336.75.75 0 01-.25.95z" />
    </svg>
);

export default ButterflyIcon;