
import React, { useState, useEffect } from 'react';
import type { ArtigoAjuda } from '../types';
import * as helpService from '../services/helpService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface HelpArticleScreenProps {
  articleId: string;
  onExit: () => void;
}

const HelpArticleScreen: React.FC<HelpArticleScreenProps> = ({ articleId, onExit }) => {
  const [article, setArticle] = useState<ArtigoAjuda | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const data = await helpService.getArticleById(articleId);
        setArticle(data);
      } catch (error) {
        console.error(error);
        setArticle({ id: 'error', titulo: 'Erro', conteudo: 'Não foi possível carregar o artigo.', categoria: 'FAQ', ordem_exibicao: 0, visualizacoes: 0, is_ativo: false });
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <header className="p-4 flex items-center justify-between shrink-0 border-b border-gray-800">
        <button onClick={onExit}><ArrowLeftIcon className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg truncate px-4">{isLoading ? 'Carregando...' : article?.titulo}</h1>
        <div className="w-6 h-6"></div>
      </header>
      <main className="flex-grow p-6 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : article ? (
          <div className="text-gray-300 space-y-4" dangerouslySetInnerHTML={{ __html: `
            <h2 class="text-2xl font-bold text-white mb-6">${article.titulo}</h2>
            ${article.conteudo}
        ` }} />
        ) : null}
      </main>
    </div>
  );
};

export default HelpArticleScreen;
