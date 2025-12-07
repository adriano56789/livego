import React from 'react';

interface SortIconProps extends React.SVGProps<SVGSVGElement> {}

const SortIcon: React.FC<SortIconProps> = (props) => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            {...props}
        >
            <path d="M3 6h18"/>
            <path d="M6 12h12"/>
            <path d="M9 18h6"/>
        </svg>
    );
};

export default SortIcon;
