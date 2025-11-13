import React from 'react';
import { User } from '../../types';

interface UserMentionSuggestionsProps {
  users: User[];
  onSelect: (username: string) => void;
}

const UserMentionSuggestions: React.FC<UserMentionSuggestionsProps> = ({ users, onSelect }) => {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-3 right-3 mb-2 bg-black/80 backdrop-blur-md rounded-lg shadow-lg max-h-48 overflow-y-auto no-scrollbar z-20">
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <button
              onMouseDown={(e) => { // Use onMouseDown to prevent input's onBlur from firing first
                e.preventDefault();
                onSelect(user.name);
              }}
              className="w-full flex items-center space-x-3 p-2 text-left hover:bg-white/10 transition-colors"
            >
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              <span className="text-white font-semibold">{user.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserMentionSuggestions;
