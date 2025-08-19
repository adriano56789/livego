import React, { ReactNode } from 'react';

interface MenuListItemProps {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
}

const MenuListItem: React.FC<MenuListItemProps> = ({ icon, label, onClick }) => {
    const defaultOnClick = () => alert(`Funcionalidade "${label}" não implementada.`);
    
    return (
        <button 
            onClick={onClick || defaultOnClick}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
        >
            <div className="flex items-center gap-4">
                <div className="text-gray-300">{icon}</div>
                <span className="font-medium text-white">{label}</span>
            </div>
            <span className="text-gray-600 text-lg">&gt;</span>
        </button>
    );
};

export default MenuListItem;