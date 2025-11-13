import React from 'react';
import { StreamHistoryEntry } from '../types';
import { BackIcon } from './icons';

interface LiveHistoryScreenProps {
  isOpen: boolean;
  onClose: () => void;
  history: StreamHistoryEntry[];
}

const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatDuration = (start: number, end: number) => {
    const durationMs = end - start;
    if (durationMs < 0) return '00:00:00';
    
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


const HistoryItem: React.FC<{ item: StreamHistoryEntry }> = ({ item }) => (
    <div className="flex items-center space-x-4 p-4 border-b border-gray-800">
        <img src={item.avatar} alt={item.name} className="w-14 h-14 rounded-full object-cover bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
        <div className="flex-grow">
            <h3 className="font-semibold text-white">{item.name}</h3>
            <p className="text-sm text-gray-400">Início: {formatDateTime(item.startTime)}</p>
            <p className="text-sm text-gray-400">Fim: {formatDateTime(item.endTime)}</p>
        </div>
        <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold text-gray-300">Duração</p>
            <p className="text-base text-white">{formatDuration(item.startTime, item.endTime)}</p>
        </div>
    </div>
);


const LiveHistoryScreen: React.FC<LiveHistoryScreenProps> = ({ isOpen, onClose, history }) => {
    if (!isOpen) {
        return null;
    }
    
    return (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
            <header className="flex items-center p-4 border-b border-gray-800 flex-shrink-0">
                <button onClick={onClose} className="absolute">
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow text-center">
                    <h1 className="text-lg font-semibold">Histórico de Lives</h1>
                </div>
                <div className="w-6"/> {/* Spacer */}
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar">
                {history.length > 0 ? (
                    history.map(item => <HistoryItem key={item.id} item={item} />)
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Nenhum histórico de lives.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LiveHistoryScreen;