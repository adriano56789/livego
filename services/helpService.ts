import type { HelpArticle } from '../types';
import { apiClient } from './apiClient';

export const getArticleById = (id: string): Promise<HelpArticle> => {
  return apiClient(`/api/help/articles/${id}`);
};
