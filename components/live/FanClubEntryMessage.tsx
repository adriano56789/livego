
import React from 'react';
export default function FanClubEntryMessage({ user }: any) {
    return (
        <div className="my-1 text-center">
            <span className="bg-pink-500/30 text-pink-200 text-xs px-2 py-1 rounded-full">
                ❤️ {user.name} entrou com Fã Clube!
            </span>
        </div>
    )
}
