import React, { useState, useMemo } from 'react';
import type { SelectableOption } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SearchIcon from './icons/SearchIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: SelectableOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({ isOpen, onClose, title, options, selectedValue, onSelect }) => {
    const [query, setQuery] = useState('');

    const filteredOptions = useMemo(() => {
        if (!query.trim()) return options;
        const lowerQuery = query.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(lowerQuery));
    }, [options, query]);
    
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-[60] bg-black/70 flex flex-col font-sans"
            onClick={onClose}
        >
            <div 
                className="bg-black w-full h-full flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex items-center shrink-0 border-b border-gray-800 relative">
                    <button onClick={onClose} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="font-semibold text-xl absolute left-1/2 -translate-x-1/2">{title}</h1>
                </header>

                <div className="p-4 shrink-0">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Pesquisar..."
                            className="w-full bg-[#1c1c1c] h-11 rounded-full pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        />
                    </div>
                </div>

                <main className="flex-grow overflow-y-auto px-4 divide-y divide-gray-800">
                    {filteredOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => onSelect(option.id)}
                            className="w-full flex justify-between items-center py-4 text-left text-white"
                        >
                            <span>{option.label}</span>
                            {selectedValue === option.id && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
                        </button>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default SelectionModal;
