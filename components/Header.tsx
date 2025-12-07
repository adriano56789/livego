
import React from 'react';
import { GlobeIcon } from './icons';
import { RiSearch2Line } from 'react-icons/ri';

interface HeaderProps {
    onOpenReminderModal: () => void;
    onOpenRegionModal: () => void;
    onOpenSearch: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenReminderModal, onOpenRegionModal, onOpenSearch }) => {
  return (
    <header className="flex items-center p-4 flex-shrink-0" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <h1 className="text-2xl font-bold flex-1">LiveGo</h1>
      <div className="flex items-center space-x-3">
        <button 
            onClick={onOpenReminderModal}
            className="w-9 h-9 bg-orange-500 rounded-md flex items-center justify-center text-white font-bold text-lg hover:bg-orange-600 transition-colors">
          T
        </button>
        <button 
            onClick={onOpenRegionModal} 
            className="w-9 h-9 bg-gray-700 rounded-md flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
        >
          <GlobeIcon className="w-5 h--5" />
        </button>
        <div className="w-px h-6 bg-gray-600 mx-1"></div>
        <button 
            onClick={onOpenSearch} 
            className="w-9 h-9 bg-gray-700 rounded-md flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
        >
          <RiSearch2Line className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;