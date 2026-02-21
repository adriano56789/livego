
import { handleRequest } from '../routes/index';
import { ProtectionAgent } from './protectionAgent';
import { applyCors } from './cors';

interface ApiResponse {
  status: number;
  data?: any;
  error?: string;
}

export const mockApiRouter = async (method: string, path: string, body?: any): Promise<ApiResponse> => {
  const isSafe = ProtectionAgent.validateAction(method, path, body);
  if (!isSafe) return { status: 403, error: "Blocked by Protection Agent" };

  try {
      // Execute Route Logic
      const result = await handleRequest(method, path, body);
      
      // Simulate CORS headers (though strictly visual/metadata in this mock return)
      // In a real Express app, middleware would run before routes.
      // Here we just ensure the result structure matches expectation.
      
      if (result.status >= 400) {
           return { status: result.status, error: result.data?.error || result.error || 'Unknown Error' };
      }
      
      return { status: result.status, data: result.data };

  } catch (e) {
      console.error(`[API MOCK] Critical Error processing ${method} ${path}:`, e);
      return { status: 500, error: 'Internal Server Error' };
  }
};
