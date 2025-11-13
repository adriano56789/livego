
import React from 'react';
import { User } from '../../types';
import { EntryEffectIcon } from '../icons';

interface FanClubEntryMessageProps {
    user: User;
    streamer: User;
}

const FanClubEntryMessage: React.FC<FanClubEntryMessageProps> = ({ user, streamer }) => {
    if (!user.fanClub) return null;

    return (
        <div className="room-effect flex justify-center py-2">
            <EntryEffectIcon 
                level={user.fanClub.level}
                streamerName={streamer.name}
                userName={user.name}
            />
        </div>
    );
};

export default FanClubEntryMessage;
