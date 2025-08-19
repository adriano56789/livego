
import React from 'react';

const ShopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124l-1.08-6.162a1.125 1.125 0 00-1.09-1.002H5.63c-.537 0-.995.357-1.09 1.002l-1.08 6.162A1.125 1.125 0 003.375 17.25H4.5m13.5-9L12 3m0 0L7.5 8.25M12 3v12" />
    </svg>
);

export default ShopIcon;