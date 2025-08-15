
import { mockApi } from './api';

export const apiClient = async <T>(url: string, options?: RequestInit): Promise<T> => {
  console.log(`[API Client] Requesting: ${options?.method || 'GET'} ${url}`);
  
  // Simulate network delay
  await new Promise(res => setTimeout(res, Math.random() * 400 + 100));

  try {
    const response = await mockApi(url, options);
    
    if (response.status >= 400) {
      console.error(`[API Client] Error Response:`, response);
      throw new Error(response.body.message || 'Erro de API');
    }
    
    return response.body as T;

  } catch (error) {
    console.error(`[API Client] FAILED Request: ${options?.method || 'GET'} ${url}`, error);
    throw error;
  }
};