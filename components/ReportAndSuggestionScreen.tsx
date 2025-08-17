import React, { useState, useRef } from 'react';
import * as liveStreamService from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PaperClipIcon from './icons/PaperClipIcon';
import SuccessIcon from './icons/SuccessIcon';
import type { User } from '../types';

interface ReportAndSuggestionScreenProps {
  user: User;
  onExit: () => void;
}

const ReportAndSuggestionScreen: React.FC<ReportAndSuggestionScreenProps> = ({ user, onExit }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'suggestion'>('report');
  
  // State for report form
  const [reportedId, setReportedId] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for suggestion form
  const [suggestion, setSuggestion] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showApiResponse } = useApiViewer();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const resetReportForm = () => {
    setReportedId('');
    setReportReason('');
    setReportDetails('');
    setFileName('');
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      if (activeTab === 'report') {
        if (!reportedId || !reportReason) {
          setError('ID do usuário e motivo são obrigatórios para denúncias.');
          setIsSubmitting(false);
          return;
        }
        const payload = { reporterId: user.id, reportedId, reportReason, reportDetails, fileName };
        await liveStreamService.submitReport(payload);
        showApiResponse('POST /api/reports', { success: true, payload });
        setSubmitSuccess('Sua denúncia foi enviada com sucesso!');
        resetReportForm();
      } else {
        if (!suggestion) {
          setError('Por favor, escreva sua sugestão.');
          setIsSubmitting(false);
          return;
        }
        const payload = { suggesterId: user.id, suggestion };
        await liveStreamService.submitSuggestion(payload);
        showApiResponse('POST /api/suggestions', { success: true, payload });
        setSubmitSuccess('Sua sugestão foi enviada com sucesso!');
        setSuggestion('');
      }
    } catch (err) {
      setError('Ocorreu um erro ao enviar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReportForm = () => (
    <div className="space-y-4">
      <input
        type="text"
        value={reportedId}
        onChange={(e) => setReportedId(e.target.value)}
        placeholder="ID do Usuário a ser denunciado"
        className="w-full bg-[#2c2c2e] h-12 rounded-md px-4 text-white placeholder-gray-500 focus:outline-none"
      />
      <input
        type="text"
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
        placeholder="Motivo (ex: assédio, spam, etc.)"
        className="w-full bg-[#2c2c2e] h-12 rounded-md px-4 text-white placeholder-gray-500 focus:outline-none"
      />
      <textarea
        value={reportDetails}
        onChange={(e) => setReportDetails(e.target.value)}
        placeholder="Forneça mais detalhes (opcional)"
        rows={5}
        className="w-full bg-[#2c2c2e] rounded-md p-4 text-white placeholder-gray-500 focus:outline-none"
      />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-between p-3 bg-[#2c2c2e] rounded-md text-left"
      >
        <span className={fileName ? 'text-white' : 'text-gray-400'}>{fileName || 'Anexar evidências (opcional)'}</span>
        <PaperClipIcon className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );

  const renderSuggestionForm = () => (
    <textarea
        value={suggestion}
        onChange={(e) => setSuggestion(e.target.value)}
        placeholder="Deixe sua sugestão para melhorarmos o aplicativo..."
        rows={8}
        className="w-full bg-[#2c2c2e] rounded-md p-4 text-white placeholder-gray-500 focus:outline-none"
      />
  );

  if (submitSuccess) {
    return (
      <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 text-center">
        <SuccessIcon className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-bold">{submitSuccess}</h2>
        <p className="text-gray-400 mt-2">Agradecemos sua contribuição.</p>
        <button onClick={onExit} className="mt-8 bg-green-500 text-black font-semibold py-3 px-12 rounded-full">
          Voltar ao Perfil
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Denúncias & Sugestões</h1>
        <div className="w-6 h-6"></div>
      </header>

      <nav className="shrink-0 flex border-b border-gray-800">
        <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 text-center font-semibold ${activeTab === 'report' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
        >
            Fazer uma Denúncia
        </button>
        <button 
            onClick={() => setActiveTab('suggestion')}
            className={`flex-1 py-3 text-center font-semibold ${activeTab === 'suggestion' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
        >
            Enviar Sugestão
        </button>
      </nav>

      <main className="flex-grow p-4 overflow-y-auto scrollbar-hide">
        {activeTab === 'report' ? renderReportForm() : renderSuggestionForm()}
        {error && <p className="text-red-400 text-center text-sm mt-4">{error}</p>}
      </main>

      <footer className="p-4 shrink-0">
         <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-green-500 text-black font-bold py-4 rounded-full text-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
        >
            {isSubmitting ? 'Enviando...' : 'Enviar'}
        </button>
      </footer>
    </div>
  );
};

export default ReportAndSuggestionScreen;
