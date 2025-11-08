import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from './types';
import { PIcon } from './components/icons';
import debounce from 'lodash/debounce';

interface ChatMessageProps {
  message: Message;
}

// Cache global para armazenar traduções
const translationCache: Record<string, string> = {};
let activeTranslations = 0;
const MAX_CONCURRENT_TRANSLATIONS = 3;

const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message }) => {
  const { avatarUrl, username, badgeLevel, text } = message;
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Limpa o estado quando o componente for desmontado
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Função debounced para evitar múltiplas chamadas rápidas
  const debouncedTranslate = useCallback(debounce(async (textToTranslate: string) => {
    if (!isMounted.current) return;
    
    try {
      const targetLanguage = navigator.language.split('-')[0];
      const cacheKey = `${textToTranslate}-${targetLanguage}`;
      
      // Verifica se já temos a tradução em cache
      if (translationCache[cacheKey]) {
        setTranslatedText(translationCache[cacheKey]);
        setShowTranslation(true);
        return;
      }

      // Limita o número de traduções simultâneas
      if (activeTranslations >= MAX_CONCURRENT_TRANSLATIONS) {
        setError("Muitas traduções em andamento. Tente novamente em alguns segundos.");
        return;
      }

      activeTranslations++;
      setIsTranslating(true);
      setError(null);

      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_AI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Traduza o seguinte texto para '${targetLanguage}'. Responda APENAS com o texto traduzido: "${textToTranslate}"`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translated = response.text();
      
      // Atualiza o cache
      translationCache[cacheKey] = translated;
      
      if (isMounted.current) {
        setTranslatedText(translated);
        setShowTranslation(true);
      }
    } catch (e) {
      console.error("Translation failed:", e);
      if (isMounted.current) {
        setError("Falha ao traduzir. Tente novamente.");
      }
    } finally {
      activeTranslations--;
      if (isMounted.current) {
        setIsTranslating(false);
      }
    }
  }, 300), []);

  const handleToggleTranslation = useCallback(() => {
    // Se já tiver tradução, apenas alterna a visibilidade
    if (translatedText) {
      setShowTranslation(prev => !prev);
      return;
    }
    
    // Se já estiver traduzindo, não faz nada
    if (isTranslating) return;
    
    // Inicia a tradução
    debouncedTranslate(text);
  }, [translatedText, isTranslating, text, debouncedTranslate]);

  // Otimização: Só recalcula quando necessário
  const translationStatus = useMemo(() => ({
    isVisible: showTranslation && translatedText,
    isLoading: isTranslating,
    error
  }), [showTranslation, translatedText, isTranslating, error]);

  return (
    <div className="flex items-start space-x-3 bg-black/60 backdrop-blur-sm p-2 rounded-lg max-w-full">
      <img
        src={avatarUrl}
        alt={`${username}'s avatar`}
        className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-white/20"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <div className="bg-orange-600/90 w-5 h-5 rounded-full flex items-center justify-center ring-1 ring-white/20 flex-shrink-0">
            <span className="text-white text-xs font-bold">{badgeLevel}</span>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 512 512" 
            className="h-4 w-4 text-cyan-400 flex-shrink-0"
            aria-hidden="true"
          >
            <path fill="currentColor" d="M378.7 32H133.3L256 182.7L378.7 32zM512 192l-107.4-141.3L256 182.7L363.4 50.7L512 192zm-4.7 22.7L416 137.3l-50.6 66.7l94 123.3L507.3 214.7zM4.7 214.7L101.3 338l94-123.3L144.7 148l-91.3 120.7L4.7 214.7zM256 480l122.7-160.7H133.3L256 480z"/>
          </svg>
          <span className="font-semibold text-white text-sm leading-none truncate">{username}</span>
        </div>
        <div className="relative">
          <div className="relative w-full">
            <p className="text-white text-sm leading-snug mt-1 break-words">
              {text}
              <button
                onClick={handleToggleTranslation}
                disabled={translationStatus.isLoading}
                className="absolute -right-8 top-0 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label={translationStatus.isVisible ? "Ocultar tradução" : "Traduzir para o seu idioma"}
                aria-busy={translationStatus.isLoading}
                style={{
                  opacity: translationStatus.isLoading ? 1 : 0.9,
                  transform: translationStatus.isLoading ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {translationStatus.isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" aria-hidden="true"></div>
                ) : (
                  <PIcon className="w-3 h-3" />
                )}
              </button>
            </p>
          </div>
          
          {translationStatus.isLoading && (
            <p className="text-gray-400 text-sm italic mt-1">Traduzindo...</p>
          )}
          
          {translationStatus.error && (
            <p className="text-red-400 text-sm mt-1">{translationStatus.error}</p>
          )}
          
          {translationStatus.isVisible && translatedText && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-green-300 text-sm italic">{translatedText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Adiciona displayName para melhor depuração
ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;