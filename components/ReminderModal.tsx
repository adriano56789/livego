import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon, ClockIcon, BellIcon, TrashIcon } from './icons';
import { api } from '../services/api';
import { Streamer } from '../types';
import { LoadingSpinner } from './Loading';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenHistory?: () => void;
    onSelectStream: (streamer: Streamer) => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onOpenHistory, onSelectStream }) => {
    const [reminders, setReminders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const loadReminders = async () => {
                setLoading(true);
                try {
                    const data = await api.getReminders();
                    setReminders(Array.isArray(data) ? data : []);
                } catch (err) {
                    setReminders([]);
                } finally {
                    setLoading(false);
                }
            };
            loadReminders();
        }
    }, [isOpen]);
    
    const handleSelectLiveStream = (streamer: Streamer) => {
        onSelectStream(streamer);
        onClose();
    };

    const handleRemove = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await api.removeReminder(id);
            setReminders(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error("Erro ao remover lembrete");
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className={`fixed inset-0 z-[120] flex justify-end transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className={`relative w-full sm:max-w-md bg-[#121212] h-full shadow-2xl transform transition-transform duration-300 border-l border-white/5 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 pt-12 border-b border-white/5 bg-[#121212]">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ChevronLeftIcon className="w-6 h-6 text-white" />
                    </button> 
                    <h2 className="text-white text-lg font-black tracking-tight">Lembretes</h2>
                    <button onClick={onOpenHistory} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ClockIcon className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto h-[calc(100%-100px)] no-scrollbar bg-[#121212]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <LoadingSpinner />
                            <span className="text-[10px] font-black uppercase text-gray-600">Acessando API...</span>
                        </div>
                    ) : reminders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-500 opacity-40 text-center">
                            <BellIcon className="w-16 h-16 mb-4" />
                            <p className="text-sm font-black uppercase tracking-widest">Nenhum lembrete</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reminders.map((item) => (
                                <div 
                                    key={item.id} 
                                    className={`flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group transition-all active:scale-[0.98] ${item.isLive ? 'hover:border-purple-500/30 cursor-pointer' : 'opacity-60'}`}
                                    onClick={() => item.isLive && handleSelectLiveStream(item as any)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-purple-600 to-pink-600">
                                                <img src={item.avatar} alt={item.name} className="w-full h-full rounded-full object-cover border-2 border-[#121212]" />
                                            </div>
                                            {item.isLive && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#121212] animate-pulse"></div>}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-black text-sm">{item.name}</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${item.isLive ? 'text-red-500' : 'text-gray-500'}`}>
                                                {item.isLive ? 'Transmissão ao vivo agora' : 'Agendado para hoje'}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => handleRemove(e, item.id)}
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReminderModal;