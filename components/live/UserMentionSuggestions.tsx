
import React from 'react';
export default function UserMentionSuggestions({ users, onSelect }: any) {
    return (
        <div className="absolute bottom-full left-0 bg-[#2C2C2E] rounded-t-xl w-full p-2">
            {users.map((u: any) => (
                <div key={u.id} className="p-2 text-white hover:bg-white/10 cursor-pointer" onClick={() => onSelect(u.name)}>
                    @{u.name}
                </div>
            ))}
        </div>
    )
}
