import React from 'react';
import { User } from '../types';

interface WatermarkProps {
    user: User;
}

const Watermark: React.FC<WatermarkProps> = ({ user }) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    return (
        <div className="absolute dynamic-watermark z-30" >
            <div className="text-white/40 text-xs font-mono select-none p-2">
                <p>Viewer: {user.name}</p>
                <p>ID: {user.identification}</p>
                <p>{timestamp}</p>
            </div>
        </div>
    );
};

export default Watermark;
