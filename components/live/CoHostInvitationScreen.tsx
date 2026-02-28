
import React from 'react';

interface CoHostInvitationScreenProps {
    onClose: () => void;
    onInvite: (userId: string) => void;
}

const CoHostInvitationScreen: React.FC<CoHostInvitationScreenProps> = ({ onClose, onInvite }) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-[#1C1C1E] p-4 rounded-lg" onClick={e => e.stopPropagation()}>
            <p>Co-Host Invitation Screen</p>
            <button onClick={() => onInvite('user1')} className="bg-blue-500 p-2 rounded mt-4">Invite Friend</button>
        </div>
    </div>
);

export default CoHostInvitationScreen;
