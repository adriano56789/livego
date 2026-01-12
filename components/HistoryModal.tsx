import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeftIcon, TrashIcon, RefreshIcon } from './icons';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import { Streamer } from '../types';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectStream: (streamer: Streamer) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onSelectStream }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const data: any = await api.getStreamHistory();
            const safeData = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
            setHistory(safeData);
        } catch (error) {
            console.error("[HistoryModal] Erro ao carregar histórico:", error);
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen, loadHistory]);

    const clearHistory = async () => {
        setIsLoading(true);
        try {
            await api.clearStreamHistory();
            setHistory([]);
        } catch (error) {
            console.error("[HistoryModal] Erro ao limpar histórico:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleItemClick = (item: any) => {
        if (item.isLive) {
            const streamer: Streamer = {
                id: item.id,
                hostId: item.streamerId,
                name: item.name,
                avatar: item.avatar,
                isLive: true,
                location: item.location || 'Brasil',
                viewers: item.viewers || 0,
                tags: item.tags || []
            };
            onSelectStream(streamer);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className={`fixed inset-0 z-[60] flex justify-end transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full sm:max-w-md bg-[#1C1C1E] h-full shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <button onClick={onClose} className="p-1">
                        <ChevronLeftIcon className="w-6 h-6 text-white" />
                    </button>
                    <h2 className="text-white text-base font-bold">Histórico de Visualização</h2>
                    <div className="flex gap-4">
                        <button className="p-1" onClick={loadHistory}>
                            <RefreshIcon className={`w-5 h-5 text-gray-400 hover:text-white ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={clearHistory} className="p-1">
                            <TrashIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-4 overflow-y-auto h-[calc(100%-60px)] no-scrollbar">
                    <p className="text-gray-500 text-xs mb-4">Visualizado nos últimos 7 dias</p>
                    
                    {isLoading ? (
                        <div className="flex justify-center items-center h-60"><LoadingSpinner /></div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 opacity-40">
                            <p className="text-gray-400 text-sm">Nenhum histórico encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item: any) => (
                                <div 
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${item.isLive ? 'hover:bg-white/5 cursor-pointer' : 'opacity-60'}`}
                                >
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                                        <img src={item.avatar} alt={item.name} className="w-full h-full object-cover"/>
                                        {item.isLive && (
                                            <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">LIVE</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{item.name}</p>
                                        <p className="text-gray-400 text-xs mt-1">Visto em: {item.lastWatchedAt ? new Date(item.lastWatchedAt).toLocaleDateString('pt-BR') : 'Recentemente'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
