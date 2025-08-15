import React from 'react';

const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.26.716.51.964.25.248.59.417.964.51l1.28.213c.542.09.94.56.94 1.11v2.594c0 .55-.398 1.02-.94 1.11l-1.28.213c-.374.063-.716.26-.964.51-.248.25-.417.59-.51.964l-.213 1.28c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.26-.716-.51-.964-.25-.248-.59-.417-.964-.51l-1.28-.213c-.542-.09-.94-.56-.94-1.11v-2.593c0-.55.398-1.02.94-1.11l1.28-.213c.374-.063.716-.26.964-.51.248-.25.417-.59.51-.964l.213-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export default SettingsIcon;
