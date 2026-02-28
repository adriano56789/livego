import React from 'react';

export const VIPBadgeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <defs>
            <linearGradient id="vipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FBBF24' }} />
                <stop offset="100%" style={{ stopColor: '#F59E0B' }} />
            </linearGradient>
        </defs>
        <path fillRule="evenodd" d="M12 21.75c-3.13 0-6.06-1.25-8.19-3.37a.75.75 0 011.06-1.06A8.25 8.25 0 0012 19.5a8.25 8.25 0 007.13-4.18.75.75 0 111.3.76C18.61 19.84 15.45 21.75 12 21.75z" fill="url(#vipGradient)" opacity="0.6" />
        <path d="M12 2.25c3.1 0 5.62 2.15 5.62 4.8 0 1.58-1.01 3.5-2.22 5.09a.75.75 0 01-1.11-.09L12.7 9.94a.75.75 0 00-1.4 0l-1.59 2.11a.75.75 0 01-1.11.09c-1.2-1.6-2.22-3.51-2.22-5.1 0-2.65 2.52-4.8 5.62-4.8z" fill="url(#vipGradient)" />
        <path d="M12 2.25C8.9 2.25 6.38 4.4 6.38 7.05c0 1.58 1.01 3.5 2.22 5.09a.75.75 0 001.11.09l1.59-2.11a.75.75 0 011.4 0l1.59 2.11a.75.75 0 001.11-.09c1.2-1.6 2.22-3.51 2.22-5.1C17.62 4.4 15.1 2.25 12 2.25zm0 1.5c-2.1 0-3.9 1.6-3.9 3.3 0 .75.4 2.05 1.25 3.32L12 7.74l2.65 2.63c.85-1.27 1.25-2.57 1.25-3.32 0-1.7-1.8-3.3-3.9-3.3z" fill="#ffffff" opacity="0.5"/>
    </svg>
);
