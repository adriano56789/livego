

import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../icons';
import { api } from '../../services/api';

interface LiveStreamManualModalProps {
  onClose: () => void;
}

interface ManualSection {
  title: string;
  content: string[];
}

const LiveStreamManualModal: React.FC<LiveStreamManualModalProps> = ({ onClose }) => {
  const [manualContent, setManualContent] = useState<ManualSection[]>([]);

  useEffect(() => {
    const fetchManual = async () => {
      try {
        const data = await api.getStreamManual();
        setManualContent(data || []);
      } catch (error) {
        console.error("Failed to fetch live stream manual:", error);
      }
    };
    fetchManual();
  }, []);

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1C1C1E] rounded-2xl w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold">Manual de Transmissão ao Vivo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <main className="flex-grow overflow-y-auto p-6 space-y-4 text-gray-300 no-scrollbar">
          {manualContent.map(section => (
            <section key={section.title}>
              <h3 className="text-lg font-semibold text-white mb-2">{section.title}</h3>
              {section.content.map((paragraph, index) => (
                <p key={index} className="mb-2">{paragraph}</p>
              ))}
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};

export default LiveStreamManualModal;