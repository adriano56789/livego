
import React from 'react';

export default function FriendRequestNotification({ followerName, onClick }: any) {
    return (
        <div className="bg-blue-500/20 text-blue-200 text-xs p-2 rounded mb-2 cursor-pointer" onClick={onClick}>
            <span className="font-bold">{followerName}</span> quer ser seu amigo. Toque para aceitar.
        </div>
    )
}
