import React, { useState, useEffect } from 'react';
import { CloseIcon, SearchIcon, PlayIcon, MusicIcon } from './icons';
import { api } from '../services/api';
import { MusicTrack } from '../types';

interface MusicSelectionModalProps {
    onClose: () => void;
    onSelect: (music: MusicTrack) => void;
}

const MusicSelectionModal: React.FC<MusicSelectionModalProps> = ({ onClose, onSelect }) => {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMusic = async () => {
            try {
                const music = await api.getMusicLibrary();
                setTracks(music || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchMusic();
    }, []);

    const filteredTracks = tracks.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-transparent" onClick={onClose}>
            <div 
                className="w-full bg-[#1C1C1E] rounded-t-2xl h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-white/5"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-white font-bold text-lg">Músicas</h3>
                    <button onClick={onClose}><CloseIcon className="text-white w-6 h-6" /></button>
                </div>

                <div className="p-4">
                    <div className="bg-[#2C2C2E] rounded-lg flex items-center px-3 py-2">
                        <SearchIcon className="text-gray-400 w-5 h-5 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar música..." 
                            className="bg-transparent text-white w-full outline-none text-sm placeholder-gray-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {loading ? (
                        <div className="text-center text-gray-500 mt-10">Carregando...</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTracks.map(track => (
                                <div key={track.id} className="flex items-center justify-between hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer" onClick={() => onSelect(track)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-800 rounded-md overflow-hidden relative">
                                            {track.coverUrl ? (
                                                <img src={track.coverUrl} className="w-full h-full object-cover" alt={track.title} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500"><MusicIcon className="w-6 h-6" /></div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm">{track.title}</h4>
                                            <p className="text-gray-400 text-xs">{track.artist}</p>
                                            <p className="text-gray-500 text-[10px]">{Math.floor((track.duration || 0) / 60)}:{String((track.duration || 0) % 60).padStart(2, '0')}</p>
                                        </div>
                                    </div>
                                    <button className="bg-[#FE2C55] text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-[#E02449]">
                                        Usar
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

export default MusicSelectionModal;
