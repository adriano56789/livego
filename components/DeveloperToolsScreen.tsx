
import React, { useState, useEffect } from 'react';
import * as devToolsService from '../services/devToolsService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useApiViewer } from './ApiContext';
import type { AppView } from '../types';

interface DeveloperToolsScreenProps {
  onExit: () => void;
  onNavigate: (view: AppView) => void;
}

const DevToolItem: React.FC<{
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}> = ({ label, onClick, icon }) => (
  <button onClick={onClick} className="w-full text-left p-4 bg-[#1c1c1c] rounded-lg hover:bg-gray-800/50 transition-colors flex items-center gap-4">
      {icon}
      <span className="font-semibold text-lg text-white">{label}</span>
      <span className="ml-auto text-gray-500">&gt;</span>
  </button>
);


const DeveloperToolsScreen: React.FC<DeveloperToolsScreenProps> = ({ onExit, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'db' | 'api'>('tools');
  const [dbState, setDbState] = useState<Record<string, any[]>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const { apiLog } = useApiViewer();

  useEffect(() => {
    if (activeTab === 'db') {
      const state = devToolsService.getDatabaseState();
      setDbState(state);
    }
  }, [activeTab]);

  const toggleKey = (key: string) => {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderTools = () => (
    <div className="space-y-4">
      <DevToolItem label="Visualizador de Componentes" onClick={() => onNavigate('component-viewer')} />
    </div>
  );

  const renderDbContent = () => (
    <div className="space-y-4">
      {Object.entries(dbState).map(([key, value]) => (
        <div key={key} className="bg-[#1c1c1c] rounded-lg">
          <button onClick={() => toggleKey(key)} className="w-full text-left p-3 flex justify-between items-center">
            <span className="font-semibold text-lg text-green-400">{key}</span>
            <span className="text-sm text-gray-400">({Array.isArray(value) ? value.length : 'Object'}) {expandedKeys[key] ? 'v' : '>'}</span>
          </button>
          {expandedKeys[key] && (
            <div className="border-t border-gray-700 p-2">
              <pre className="text-xs text-gray-300 overflow-auto max-h-64 bg-black/50 p-2 rounded">
                <code>{JSON.stringify(value, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderApiLogContent = () => (
     <div className="space-y-2">
      {apiLog.length > 0 ? (
        apiLog.map(log => (
          <div key={log.id} className="bg-[#1c1c1c] rounded-lg">
            <button onClick={() => toggleKey(`api-${log.id}`)} className="w-full text-left p-3 flex justify-between items-center">
              <span className="font-semibold text-sm text-cyan-400 truncate">{log.title}</span>
              <span className="text-xs text-gray-500 shrink-0 ml-4">{expandedKeys[`api-${log.id}`] ? 'v' : '>'}</span>
            </button>
            {expandedKeys[`api-${log.id}`] && (
              <div className="border-t border-gray-700 p-2">
                <pre className="text-xs text-gray-300 overflow-auto max-h-64 bg-black/50 p-2 rounded">
                  <code>{JSON.stringify(log.data, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center pt-10">Nenhuma chamada de API registrada ainda.</p>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Ferramentas do Desenvolvedor</h1>
        <div className="w-6 h-6"></div>
      </header>
      
      <nav className="shrink-0 flex border-b border-gray-800">
        <button 
            onClick={() => setActiveTab('tools')}
            className={`flex-1 py-3 text-center font-semibold ${activeTab === 'tools' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
        >
            Ferramentas
        </button>
        <button 
            onClick={() => setActiveTab('db')}
            className={`flex-1 py-3 text-center font-semibold ${activeTab === 'db' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
        >
            BD Simulado
        </button>
        <button 
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-3 text-center font-semibold ${activeTab === 'api' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
        >
            API Log
        </button>
      </nav>

      <main className="flex-grow p-4 overflow-y-auto scrollbar-hide">
        {activeTab === 'tools' && renderTools()}
        {activeTab === 'db' && renderDbContent()}
        {activeTab === 'api' && renderApiLogContent()}
      </main>
    </div>
  );
};

export default DeveloperToolsScreen;
