import { api } from './api';

interface TranslationResult {
  translatedText: string;
  originalText: string;
  from: string;
  to: string;
  fromCache: boolean;
  detectedSourceLanguage?: string;
  error?: string;
}

/**
 * Traduz um texto para o idioma de destino
 * @param text Texto a ser traduzido
 * @param targetLang Código do idioma de destino (ex: 'pt', 'en')
 * @param sourceLang Código do idioma de origem (opcional)
 * @returns Objeto com o texto traduzido e informações adicionais
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<TranslationResult> {
  try {
    // Chama a API de tradução
    const response = await api.translate(text, targetLang);
    
    return {
      translatedText: response.translatedText,
      originalText: text,
      from: sourceLang || 'auto',
      to: targetLang,
      fromCache: false,
      detectedSourceLanguage: sourceLang
    };
  } catch (error) {
    console.error('Erro ao traduzir texto:', error);
    // Em caso de erro, retorna o texto original
    return {
      translatedText: text,
      originalText: text,
      from: sourceLang || 'auto',
      to: targetLang,
      fromCache: false,
      error: 'Falha ao traduzir o texto'
    };
  }
}

/**
 * Processa um lote de mensagens para tradução
 */
export async function translateBatch(
  messages: Array<{ id: string | number; text: string }>,
  targetLang: string,
  sourceLang?: string
) {
  const results = await Promise.all(
    messages.map(async (msg) => {
      try {
        const result = await translateText(msg.text, targetLang, sourceLang);
        return {
          id: msg.id,
          ...result
        };
      } catch (error) {
        console.error(`Erro ao traduzir mensagem ${msg.id}:`, error);
        return {
          id: msg.id,
          originalText: msg.text,
          translatedText: msg.text,
          error: 'Falha na tradução',
          from: sourceLang || 'auto',
          to: targetLang,
          fromCache: false
        };
      }
    })
  );

  return results;
}
