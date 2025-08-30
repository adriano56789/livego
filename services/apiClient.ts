import { handleApiRequest } from './api';
import { apiLogger } from './apiLogger';

/**
 * A generic API client function that calls the in-browser mock API directly.
 * It automatically logs every request and response to the ApiViewer via the apiLogger.
 * @param path The API endpoint path (e.g., '/api/users/1').
 * @param options The standard RequestInit options object (method, body, etc.).
 * @returns A promise that resolves with the response data.
 */
export const apiClient = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.parse(options.body as string) : null;
    // Extract query params from path for the mock handler
    const url = new URL(path, 'http://localhost');
    const query = url.searchParams;
    const cleanPath = url.pathname;
    
    const requestTitle = `${method} ${path}`;

    try {
        // Direct call to the in-memory API handler
        const responseData = await handleApiRequest(method, cleanPath, body, query);

        apiLogger.log(requestTitle, {
            request: { method, path: cleanPath, body },
            response: responseData,
        });
        
        return responseData;
    } catch (error) {
        apiLogger.log(requestTitle, {
            request: { method, path: cleanPath, body },
            error: error instanceof Error ? error.message : String(error),
        });
        
        throw error;
    }
};
