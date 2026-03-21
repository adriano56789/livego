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

interface ManualResponse {
  success: boolean;
  data: {
    titulo: string;
    secoes: Array<{
      titulo: string;
      itens: string[];
    }>;
  };
}

const LiveStreamManualModal: React.FC<LiveStreamManualModalProps> = ({ onClose }) => {
  const [manualContent, setManualContent] = useState<ManualSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManual = async () => {
      try {
        setLoading(true);
        // Usar o método correto da API
        const response = await api.getManualTransmissao();
        const data: ManualResponse = response;
        
        // Transformar os dados para o formato esperado pelo componente
        if (data.success && data.data) {
          const transformedContent: ManualSection[] = data.data.secoes.map(secao => ({
            title: secao.titulo,
            content: secao.itens
          }));
          setManualContent(transformedContent);
        }
      } catch (error) {
        console.error('Erro ao buscar manual:', error);
        setManualContent([]);
      } finally {
        setLoading(false);
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
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">Carregando manual...</div>
            </div>
          ) : manualContent.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">Manual não disponível no momento.</div>
            </div>
          ) : (
            manualContent.map(section => (
              <section key={section.title}>
                <h3 className="text-lg font-semibold text-white mb-2">{section.title}</h3>
                {section.content.map((paragraph, index) => (
                  <p key={index} className="mb-2">{paragraph}</p>
                ))}
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
};

export default LiveStreamManualModal;