
import React from 'react';

const VenusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10.5 14.25v6.75M7.125 17.625h6.75" />
    </svg>
);

export default VenusIcon;