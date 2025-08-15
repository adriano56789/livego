

import React, { useState, useEffect, useCallback } from 'react';
import type { AppEvent, EventStatus } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface EventCenterScreenProps {
  onExit: () => void;
  onViewEvent: (eventId: string) => void;
}

type EventTab = EventStatus;

const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = { d: 0, h: 0, m: 0, s: 0 };

        if (difference > 0) {
            timeLeft = {
                d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                m: Math.floor((difference / 1000 / 60) % 60),
                s: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });
    
    const format = (t: number) => t.toString().padStart(2, '0');

    return (
        <div className="flex items-center gap-2 text-sm font-semibold text-yellow-300">
            <span className="font-mono bg-black/30 px-2 py-1 rounded-md">{format(timeLeft.d)}D</span>
            <span className="font-mono bg-black/30 px-2 py-1 rounded-md">{format(timeLeft.h)}H</span>
            <span className="font-mono bg-black/30 px-2 py-1 rounded-md">{format(timeLeft.m)}M</span>
            <span className="font-mono bg-black/30 px-2 py-1 rounded-md">{format(timeLeft.s)}S</span>
        </div>
    );
};


const EventCard: React.FC<{ event: AppEvent, onClick: () => void }> = ({ event, onClick }) => {
    const isOver = event.status === 'past';
    return (
        <button onClick={onClick} className="bg-[#1c1c1c] rounded-lg overflow-hidden shadow-lg w-full text-left transition-transform hover:scale-[1.02]">
            <div className="relative aspect-[16/8]">
                <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
                {isOver && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-2xl font-bold text-gray-400 border-2 border-gray-400 px-4 py-2 rounded-lg -rotate-12">ENCERRADO</span></div>}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg text-white mb-2">{event.title}</h3>
                <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">{event.description}</p>
                {!isOver && (
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                            {event.status === 'ongoing' ? 'Termina em:' : 'Começa em:'}
                        </div>
                        <CountdownTimer targetDate={event.status === 'ongoing' ? event.endTime : event.startTime} />
                    </div>
                )}
            </div>
        </button>
    );
};

const EventCenterScreen: React.FC<EventCenterScreenProps> = ({ onExit, onViewEvent }) => {
  const [activeTab, setActiveTab] = useState<EventTab>('ongoing');
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showApiResponse } = useApiViewer();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await liveStreamService.getEventsByStatus(activeTab);
        showApiResponse(`GET /api/events?status=${activeTab}`, data);
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, showApiResponse]);

  
  const TABS: { key: EventTab, label: string }[] = [
    { key: 'ongoing', label: 'Em Andamento' },
    { key: 'upcoming', label: 'Próximos' },
    { key: 'past', label: 'Passados' },
  ];

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Central de Eventos</h1>
        <div className="w-6 h-6"></div>
      </header>

      <nav className="shrink-0 flex border-b border-gray-800">
        {TABS.map(tab => (
           <button 
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-center font-semibold ${activeTab === tab.key ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
            >
                {tab.label}
            </button>
        ))}
      </nav>

      <main className="flex-grow p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            {events.map(event => <EventCard key={event.id} event={event} onClick={() => onViewEvent(event.id)} />)}
          </div>
        ) : (
          <div className="text-center text-gray-500 pt-20">
            <p>Nenhum evento encontrado nesta categoria.</p>
          </div>
        )}
      </main>
      <style>{`
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
      `}</style>
    </div>
  );
};

export default EventCenterScreen;