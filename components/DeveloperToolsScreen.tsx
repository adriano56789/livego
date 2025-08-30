import React, { useState, useEffect } from 'react';
import * as devToolsService from '../services/devToolsService';
import * as monitoringService from '../services/monitoringService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useApiViewer } from './ApiContext';
import type { AppView } from '../types';
import CodeBracketIcon from './icons/CodeBracketIcon';
import BeakerIcon from './icons/BeakerIcon'; // Placeholder, you might need to create this icon

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
  const { apiLog, showApiResponse } = useApiViewer();
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const handleHealthCheck = async () => {
      setIsCheckingHealth(true);
      try {
          // The result will be automatically displayed by the ApiViewer context
          await monitoringService.checkApiHealth();
      } catch (error) {
          console.error("API Health Check failed:", error);
          alert("Falha ao executar a verificação de saúde. Verifique o console do servidor.");
      } finally {
          setIsCheckingHealth(false);
      }
  };
  
  const handleDiagnosticsTest = async () => {
      setIsDiagnosing(true);
      try {
          const result = await monitoringService.runFullDiagnosticsTest();
          // Manually call showApiResponse because the response is a special text report
          showApiResponse('GET /api/diagnostics/full-test', result);
      } catch (error) {
          console.error("API Diagnostics Test failed:", error);
           alert("Falha ao executar o teste de diagnóstico. Verifique o console do servidor.");
      } finally {
          setIsDiagnosing(false);
      }
  };


  useEffect(() => {
    if (activeTab === 'db') {
      try {
        const state = devToolsService.getDatabaseState();
        setDbState(state);
      } catch (e) {
        console.error("Failed to fetch DB state for dev tools:", e);
        setDbState({ error: ['Failed to load database state.'] });
      }
    }
  }, [activeTab]);

  const toggleKey = (key: string) => {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderTools = () => (
    <div className="space-y-4">
      <DevToolItem label="Visualizador de Componentes" onClick={() => onNavigate('component-viewer')} />
       <button 
          onClick={handleHealthCheck} 
          disabled={isCheckingHealth}
          className="w-full text-left p-4 bg-[#1c1c1c] rounded-lg hover:bg-gray-800/50 transition-colors flex items-center gap-4 disabled:opacity-50"
      >
          <CodeBracketIcon className="w-6 h-6 text-red-400"/>
          <div className="flex-grow">
              <span className="font-semibold text-lg text-white">Executar Verificação de Saúde da API</span>
              <p className="text-sm text-gray-400">Testa todos os endpoints críticos para disponibilidade.</p>
          </div>
          {isCheckingHealth ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
              <span className="ml-auto text-gray-500">&gt;</span>
          )}
      </button>
       <button 
          onClick={handleDiagnosticsTest} 
          disabled={isDiagnosing}
          className="w-full text-left p-4 bg-[#1c1c1c] rounded-lg hover:bg-gray-800/50 transition-colors flex items-center gap-4 disabled:opacity-50"
      >
          <BeakerIcon className="w-6 h-6 text-yellow-400"/>
          <div className="flex-grow">
              <span className="font-semibold text-lg text-white">Executar Teste de Diagnóstico Completo</span>
              <p className="text-sm text-gray-400">Mede a latência interna vs. externa para encontrar gargalos.</p>
          </div>
          {isDiagnosing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
              <span className="ml-auto text-gray-500">&gt;</span>
          )}
      </button>
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

const BeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355-.186-.676-.401-.959l-1.112-1.667a.963.963 0 00-.832-.461h-2.25c-.334 0-.645.17-.832.461L7.54 5.128a1.125 1.125 0 00-.401.959v2.175a.963.963 0 00.461.832l1.667 1.112c.355.236.676.186.959.401l1.667-1.112a.963.963 0 00.461-.832V6.087z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087a3.375 3.375 0 00-5.25 0m5.25 0a3.375 3.375 0 01-5.25 0M3 12l3.375-3.375m14.25 0L18 12m-15 0h18c.621 0 1.125.504 1.125 1.125v4.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.625v-4.5C3 12.504 3.504 12 4.125 12h.001z" />
    </svg>
);


export default DeveloperToolsScreen;
