
import { handleApiRequest } from './api';

/**
 * A generic API client function that delegates to the mock API handler.
 * This simulates making a network request.
 * @param path The API endpoint path (e.g., '/api/users/1').
 * @param options The standard RequestInit options object (method, body, etc.).
 * @returns A promise that resolves with the response data.
 */
export const apiClient = <T>(path: string, options?: RequestInit): Promise<T> => {
    const method = options?.method || 'GET';
    const body = options?.body && typeof options.body === 'string' ? JSON.parse(options.body) : null;
    
    // Extract query parameters from the path
    const url = new URL(path, 'http://localhost'); // Using a dummy base URL to utilize URL API
    const query = url.searchParams;
    const purePath = url.pathname;

    return handleApiRequest(method, purePath, body, query);
};
