import { db } from './database';

export interface TranslationCache {
  id: string;
  originalText: string;
  targetLang: string;
  translatedText: string;
  createdAt: Date;
  lastAccessed: Date;
}

export async function getCachedTranslation(originalText: string, targetLang: string): Promise<TranslationCache | null> {
  try {
    // Create a cache key based on the text and target language
    const cacheKey = `${targetLang}:${originalText.toLowerCase().trim()}`;
    
    // Check if we have a cached translation
    const cacheEntry = db.translationCache.find(cache => 
      cache.targetLang === targetLang && 
      cache.originalText.toLowerCase().trim() === originalText.toLowerCase().trim()
    );

    if (cacheEntry) {
      // Update the last accessed time
      cacheEntry.lastAccessed = new Date();
      return cacheEntry;
    }
    
    return null;
  } catch (error) {
    console.error('Error accessing translation cache:', error);
    return null;    
  }
}

export async function saveTranslationToCache(
  originalText: string, 
  targetLang: string, 
  translatedText: string
): Promise<TranslationCache> {
  try {
    const now = new Date();
    const newCacheEntry: TranslationCache = {
      id: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalText: originalText.trim(),
      targetLang,
      translatedText,
      createdAt: now,
      lastAccessed: now
    };

    // Add to in-memory database
    db.translationCache.push(newCacheEntry);
    
    // In a real implementation, you would save to a persistent database here
    
    return newCacheEntry;
  } catch (error) {
    console.error('Error saving to translation cache:', error);
    throw error;
  }
}
