
import React from 'react';

const ApplauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12.5 18.5c-2 0-2.5-1-4-1s-3 1-3 1" />
        <path d="M11.5 18.5c2 0 2.5-1 4-1s3 1 3 1" />
        <path d="M8.5 15.5c-3-2-3-5 .5-6.5" />
        <path d="M15.5 15.5c3-2 3-5-.5-6.5" />
        <circle cx="9.5" cy="11.5" r="1.5" />
        <circle cx="14.5" cy="11.5" r="1.5" />
    </svg>
);

export default ApplauseIcon;
