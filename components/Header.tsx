
import React from 'react';
import { GlobeIcon, SearchIcon } from './icons';

interface HeaderProps {
    onOpenReminderModal: () => void;
    onOpenRegionModal: () => void;
    onOpenSearch: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenReminderModal, onOpenRegionModal, onOpenSearch }) => {
  return (
    <header className="flex items-center justify-between p-4 flex-shrink-0">
      <h1 className="text-2xl font-bold">LiveGo</h1>
      <div className="flex items-center space-x-3">
        <button 
            onClick={onOpenReminderModal}
            className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center text-white font-bold text-lg hover:bg-orange-600 transition-colors">
          T
        </button>
        <button onClick={onOpenRegionModal} className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center text-white hover:bg-gray-600 transition-colors">
          <GlobeIcon className="w-5 h-5" />
        </button>
        <button onClick={onOpenSearch} className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center text-white hover:bg-gray-600 transition-colors">
          <SearchIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;