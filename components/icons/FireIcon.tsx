import React from 'react';

const FireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12.25 8.25a3.75 3.75 0 10-7.5 0 3.75 3.75 0 007.5 0z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M6.5 8.25a2.25 2.25 0 104.5 0 2.25 2.25 0 00-4.5 0z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M9.135 1.018a.75.75 0 011.73 0l.258.419a.75.75 0 001.298-.797.75.75 0 011.458-.291c.07.185.07.389 0 .574a.75.75 0 01-1.458-.291.75.75 0 00-1.3 -.797L10 1.018z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M10 3.25a.75.75 0 01.75.75v.754a2.25 2.25 0 11-1.5 0V4A.75.75 0 0110 3.25zM10 18a.75.75 0 01-.75-.75V15.5a2 2 0 114 0v1.75a.75.75 0 01-1.5 0V15.5a.5.5 0 10-1 0v1.75A.75.75 0 0110 18zM5.75 12.5a.75.75 0 01-.75-.75V9.667a2.5 2.5 0 115 0V11.75a.75.75 0 01-1.5 0V9.667a1 1 0 10-2 0V11.75a.75.75 0 01-.75.75z" clipRule="evenodd" />
    </svg>
);

export default FireIcon;