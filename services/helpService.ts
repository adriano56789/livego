import type { ArtigoAjuda, CanalContato } from '../types';
import { apiClient } from './apiClient';

export const getArticleById = (id: string): Promise<ArtigoAjuda> => {
  return apiClient(`/api/help/articles/${id}`);
};

export const getHelpArticles = (category?: 'FAQ' | 'Artigos Úteis'): Promise<ArtigoAjuda[]> => {
  const url = category ? `/api/help/articles?category=${category}` : '/api/help/articles';
  return apiClient(url);
};

export const getContactChannels = (): Promise<CanalContato[]> => {
  return apiClient(`/api/help/contact-channels`);
};
