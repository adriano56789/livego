import React from 'react';
import type { Stream, User } from '../types';
import ViewersIcon from './icons/ViewersIcon';
import LockClosedIcon from './icons/LockSolidIcon';
import DiamondIcon from './icons/DiamondIcon';
import Flag from './Flag';
import AudioVisualizer from './AudioVisualizer'; // Import the visualizer

interface StreamerCardProps {
    stream: Stream;
    onViewStream: (stream: Stream) => void;
    currentUser: User; // The currently logged-in user
}

const StreamerCard: React.FC<StreamerCardProps> = ({ stream, onViewStream, currentUser }) => {
    const isOwnStream = stream.userId === currentUser.id;

    // Format viewer count to K
    const formatViewers = (num: number): string => {
        const value = num || 0;
        if (value >= 1000) {
            return (value / 1000).toFixed(1).replace('.0', '') + 'K';
        }
        return value.toString();
    };

    const colors = ['bg-pink-500/50', 'bg-blue-500/50', 'bg-green-500/50', 'bg-purple-500/50', 'bg-red-500/50', 'bg-orange-500/50'];
    const color = colors[stream.userId % colors.length];

    return (
        <button 
            onClick={() => onViewStream(stream)}
            className="relative rounded-lg overflow-hidden aspect-[3/4] flex flex-col justify-end text-white shadow-lg bg-gray-900 text-left"
        >
            {/* 1. Background Image or Placeholder */}
            {stream.thumbnailUrl ? (
                <img src={stream.thumbnailUrl} alt={stream.titulo || stream.nomeStreamer} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <div className={`absolute inset-0 w-full h-full ${color} flex items-center justify-center`}>
                    <span className="text-white font-bold text-4xl opacity-80">{(stream.nomeStreamer || '').substring(0, 1)}</span>
                </div>
            )}
            
            {/* 2. Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20"></div>
            
            {/* 3. Badges (top-left) */}
            {stream.isPrivate && (
                 <div className="absolute top-2 left-2 z-10 bg-purple-800/80 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-bold shadow-md text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                    <LockClosedIcon className="w-3.5 h-3.5" />
                    {stream.entryFee && stream.entryFee > 0 ? (
                        <div className="flex items-center gap-1">
                           <DiamondIcon className="w-4 h-4" />
                           <span className="font-semibold">{stream.entryFee}</span>
                        </div>
                    ) : (
                        <span>Privada</span>
                    )}
                 </div>
            )}
            {stream.emPk && !stream.isPrivate && (
                 <div className="absolute top-2 left-2 z-10 bg-[#581c87]/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-sm font-bold shadow-md text-pink-200 border border-purple-400/30">
                    PK
                 </div>
            )}

            {/* Category Badge (top-right) */}
            {stream.categoria && (
                 <div className="absolute top-2 right-2 z-10 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold shadow-md">
                    {stream.categoria}
                </div>
            )}
            
            {/* 4. Text Content */}
            <div className="relative z-10 p-2">
                {/* Title of the stream */}
                <h3 className="font-bold text-base truncate drop-shadow-sm">{stream.titulo || stream.nomeStreamer}</h3>
                
                {/* Bottom row: streamer name + viewers/country */}
                <div className="flex items-center justify-between text-xs text-gray-200 mt-1">
                    <p className="truncate max-w-[50%] drop-shadow-sm">{stream.nomeStreamer}</p>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {isOwnStream ? (
                                <>
                                    <span className="drop-shadow-sm">{stream.espectadores}</span>
                                    <AudioVisualizer colorClassName="text-white" />
                                </>
                            ) : (
                                <>
                                    <ViewersIcon className="w-3 h-3" />
                                    <span className="drop-shadow-sm">{formatViewers(stream.espectadores)}</span>
                                </>
                            )}
                        </div>
                        {!isOwnStream && stream.countryCode && <Flag code={stream.countryCode} className="w-5 h-auto rounded-sm" />}
                    </div>
                </div>
            </div>

            {/* Special Event Banner */}
            {stream.meta === 'Evento de PK' && (
                <div className="absolute inset-x-0 bottom-1/3 z-10">
                    <div className="bg-blue-600/80 backdrop-blur-sm text-center py-2 mx-2 rounded-lg border border-blue-400/50 shadow-xl">
                        <h4 className="font-black text-xl tracking-wide uppercase drop-shadow-lg">Evento de PK</h4>
                    </div>
                </div>
            )}
        </button>
    );
};

export default StreamerCard;