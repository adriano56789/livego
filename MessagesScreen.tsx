import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { avatarUrl, username, badgeLevel, text } = message;
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleTranslation = async () => {
    // If translation is already fetched, just toggle visibility
    if (translatedText) {
      setShowTranslation(!showTranslation);
      return;
    }

    // Prevent multiple requests
    if (isTranslating) return;

    setIsTranslating(true);
    setError(null);
    try {
      // Detect user's browser language to use as the target for translation
      const targetLanguage = navigator.language.split('-')[0];

      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Detect the language of the following text and translate it to '${targetLanguage}'. Your response should ONLY contain the translated text and nothing else. The text is: "${text}"`,
      });
      setTranslatedText(response.text);
      setShowTranslation(true);
    } catch (e) {
      console.error("Translation failed:", e);
      setError("Failed to translate.");
      setShowTranslation(false);
    } finally {
      setIsTranslating(false);
    }
  };


  return (
    <div className="flex items-start space-x-3 bg-black/60 backdrop-blur-sm p-2 rounded-lg max-w-full">
      <img
        src={avatarUrl}
        alt={`${username}'s avatar`}
        className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-white/20"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
            <div className="bg-orange-600/90 w-5 h-5 rounded-full flex items-center justify-center ring-1 ring-white/20 flex-shrink-0">
                <span className="text-white text-xs font-bold">{badgeLevel}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-4 w-4 text-cyan-400 flex-shrink-0">
              <path fill="currentColor" d="M378.7 32H133.3L256 182.7L378.7 32zM512 192l-107.4-141.3L256 182.7L363.4 50.7L512 192zm-4.7 22.7L416 137.3l-50.6 66.7l94 123.3L507.3 214.7zM4.7 214.7L101.3 338l94-123.3L144.7 148l-91.3 120.7L4.7 214.7zM256 480l122.7-160.7H133.3L256 480z"/>
            </svg>
            <span className="font-semibold text-white text-sm leading-none truncate">{username}</span>
        </div>
        <div className="flex items-start justify-between space-x-2">
            <p className="text-white text-sm leading-snug mt-1 break-words flex-1">
              {text}
            </p>
            <button
                onClick={handleToggleTranslation}
                disabled={isTranslating}
                className={`mt-1 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                    showTranslation && translatedText
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                aria-label={showTranslation && translatedText ? "Hide translation" : "Translate to your language"}
            >
                P
            </button>
        </div>
        {isTranslating && <p className="text-gray-400 text-sm italic mt-1">Translating...</p>}
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        {showTranslation && translatedText && (
            <div className="mt-2 pt-2 border-t border-white/10">
                 <p className="text-green-300 text-sm italic">{translatedText}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;