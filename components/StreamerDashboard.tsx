
import React, { useState, useEffect } from 'react';
import type { StartLiveResponse } from '../types';
import EyeIcon from './icons/EyeIcon';
import CopyIcon from './icons/CopyIcon';
import { addStreamListener, removeStreamListener } from '../services/liveStreamService';
import type { StreamUpdateListener } from '../types';

interface StreamerDashboardProps {
  streamData: StartLiveResponse;
  onStopStream: () => void;
}

const InfoCard: React.FC<{ label: string; value: string; canCopy?: boolean }> = ({ label, value, canCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white/10 p-4 rounded-lg">
            <label className="text-xs text-gray-400 block mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <p className="text-sm font-mono truncate flex-grow">{value}</p>
                {canCopy && (
                    <button onClick={handleCopy} className="bg-white/20 p-1.5 rounded-md hover:bg-white/30 transition-colors">
                        {copied ? <span className="text-xs text-lime-400">Copiado!</span> : <CopyIcon className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
};

const StreamerDashboard: React.FC<StreamerDashboardProps> = ({ streamData, onStopStream }) => {
    const [viewers, setViewers] = useState(streamData.live.espectadores);

    useEffect(() => {
        const listener: StreamUpdateListener = (allStreams) => {
            const myStream = allStreams.find(s => s.id === streamData.live.id);
            if (myStream) {
                setViewers(myStream.espectadores);
            }
        };
        addStreamListener(listener);
        return () => removeStreamListener(listener);
    }, [streamData.live.id]);
    
    return (
        <div className="h-screen w-full bg-black text-white p-4 flex flex-col font-sans">
            <header className="text-center mb-6">
                 <h1 className="text-2xl font-bold">Você está ao vivo!</h1>
                 <p className="text-gray-400">Gerencie sua transmissão abaixo.</p>
            </header>

            <main className="flex-grow flex flex-col gap-4">
                <div className="bg-lime-900/50 border border-lime-500/50 p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-lg truncate max-w-[200px]">{streamData.live.titulo}</h2>
                        <p className="text-sm text-lime-300">{streamData.live.categoria}</p>
                    </div>
                    <div className="flex items-center gap-2 text-lg font-bold">
                        <EyeIcon className="w-6 h-6 text-lime-400" />
                        <span>{viewers}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-gray-300 font-semibold">Configuração do Stream</h3>
                    <InfoCard label="URL do Servidor RTMP" value={streamData.urls.rtmp} canCopy />
                    <InfoCard label="Chave da Stream" value={streamData.urls.streamKey} canCopy />
                </div>
            </main>

            <footer className="shrink-0 pt-4">
                <button
                    onClick={onStopStream}
                    className="w-full bg-red-600 text-white font-bold py-4 rounded-full text-lg transition-opacity hover:opacity-90"
                >
                    Parar Transmissão
                </button>
            </footer>
        </div>
    );
};

export default StreamerDashboard;