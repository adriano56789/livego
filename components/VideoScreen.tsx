
import React from 'react';
import VideoIcon from './icons/VideoIcon';

const VideoScreen: React.FC = () => {
    const PlaceholderCard = () => (
        <div className="aspect-[9/16] bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-600">
             <VideoIcon className="w-12 h-12 mb-2"/>
        </div>
    );
    return (
        <div className="h-full w-full bg-[#191919] flex flex-col text-white p-4 font-sans">
             <header className="text-center py-4">
                <h1 className="text-2xl font-bold">Vídeos</h1>
                <p className="text-gray-400">Em breve!</p>
            </header>
            <main className="flex-grow grid grid-cols-2 gap-4 opacity-50">
                <PlaceholderCard />
                <PlaceholderCard />
                <PlaceholderCard />
                <PlaceholderCard />
            </main>
        </div>
    );
};

export default VideoScreen;
