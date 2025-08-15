
import React from 'react';

interface ApiViewerProps {
  title: string;
  data: object;
  onClose: () => void;
}

const ApiViewer: React.FC<ApiViewerProps> = ({ title, data, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#1c1c1c] rounded-t-2xl w-full max-w-4xl h-2/3 flex flex-col shadow-lg border-t border-gray-700 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
          <h2 className="text-base font-semibold text-lime-400 font-mono tracking-wide">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-white bg-gray-700/50 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            aria-label="Fechar visualizador de API"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <pre className="text-sm text-gray-300 p-4 overflow-auto flex-grow font-mono bg-[#121212] rounded-b-lg">
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ApiViewer;
