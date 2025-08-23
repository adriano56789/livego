
import { handleApiRequest } from './api';
import { apiLogger } from './apiLogger';

/**
 * A generic API client function that delegates to the mock API handler.
 * This simulates making a network request and now automatically logs
 * every request and response to the ApiViewer via the apiLogger.
 * @param path The API endpoint path (e.g., '/api/users/1').
 * @param options The standard RequestInit options object (method, body, etc.).
 * @returns A promise that resolves with the response data.
 */
export const apiClient = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const method = options?.method || 'GET';
    const body = options?.body && typeof options.body === 'string' ? JSON.parse(options.body) : null;
    
    // Extract query parameters from the path
    const url = new URL(path, 'http://localhost'); // Using a dummy base URL to utilize URL API
    const query = url.searchParams;
    const purePath = url.pathname;

    const requestTitle = `${method} ${path}`;

    try {
        const response = await handleApiRequest(method, purePath, body, query);
        
        // Log the successful request and its response
        apiLogger.log(requestTitle, {
            request: {
                method,
                path,
                body,
            },
            response,
        });
        
        return response;
    } catch (error) {
        // Log the error
        apiLogger.log(requestTitle, {
            request: {
                method,
                path,
                body,
            },
            error: error instanceof Error ? error.message : String(error),
        });
        
        // Re-throw the error so the calling function can handle it
        throw error;
    }
};
