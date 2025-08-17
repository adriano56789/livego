
import React, { useState, useEffect, useCallback } from 'react';
import type { AppEvent } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface EventDetailScreenProps {
  eventId: string;
  onExit: () => void;
  onParticipate: (event: AppEvent) => void;
}

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
        const timer = setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearTimeout(timer);
    });
    
    const format = (t: number) => t.toString().padStart(2, '0');

    return (
        <div className="flex items-center gap-2 text-white">
            <div className="text-center">
                <span className="font-mono text-3xl font-bold bg-black/30 px-3 py-2 rounded-md">{format(timeLeft.d)}</span>
                <span className="text-xs block mt-1 text-gray-400">DIAS</span>
            </div>
            <span className="text-3xl font-bold text-gray-500">:</span>
            <div className="text-center">
                <span className="font-mono text-3xl font-bold bg-black/30 px-3 py-2 rounded-md">{format(timeLeft.h)}</span>
                <span className="text-xs block mt-1 text-gray-400">HORAS</span>
            </div>
            <span className="text-3xl font-bold text-gray-500">:</span>
            <div className="text-center">
                <span className="font-mono text-3xl font-bold bg-black/30 px-3 py-2 rounded-md">{format(timeLeft.m)}</span>
                <span className="text-xs block mt-1 text-gray-400">MIN</span>
            </div>
            <span className="text-3xl font-bold text-gray-500">:</span>
            <div className="text-center">
                <span className="font-mono text-3xl font-bold bg-black/30 px-3 py-2 rounded-md">{format(timeLeft.s)}</span>
                <span className="text-xs block mt-1 text-gray-400">SEG</span>
            </div>
        </div>
    );
};

const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ eventId, onExit, onParticipate }) => {
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        const data = await liveStreamService.getEventById(eventId);
        setEvent(data);
      } catch (error) {
        console.error("Failed to fetch event details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
        <header className="p-4 flex items-center shrink-0 border-b border-gray-800">
          <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg text-center flex-grow">Evento não encontrado</h1>
        </header>
        <main className="flex-grow p-4 flex items-center justify-center">
          <p className="text-gray-400">Não foi possível carregar os detalhes do evento.</p>
        </main>
      </div>
    );
  }

  const isOver = event.status === 'past';

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <div className="absolute top-0 left-0 w-full h-2/3 md:h-1/2">
        <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      </div>

      <header className="relative z-10 p-4 flex items-center shrink-0">
        <button onClick={onExit} className="p-2 bg-black/30 rounded-full backdrop-blur-sm"><ArrowLeftIcon className="w-6 h-6" /></button>
      </header>

      <main className="relative z-10 flex-grow p-4 overflow-y-auto flex flex-col justify-end scrollbar-hide">
        <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">{event.title}</h1>
        <p className="text-base text-gray-200 mb-6 drop-shadow-md">{event.description}</p>
        
        {!isOver && (
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg mb-6">
                <div className="text-sm text-gray-300 mb-2">
                    {event.status === 'ongoing' ? 'Termina em:' : 'Começa em:'}
                </div>
                <CountdownTimer targetDate={event.status === 'ongoing' ? event.endTime : event.startTime} />
            </div>
        )}
      </main>

      <footer className="relative z-10 p-4 shrink-0">
        <button 
          disabled={isOver}
          onClick={() => onParticipate(event)}
          className="w-full bg-green-500 text-black font-bold py-4 rounded-full text-lg transition-opacity hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isOver ? 'Evento Encerrado' : 'Participar Agora'}
        </button>
      </footer>
    </div>
  );
};

export default EventDetailScreen;