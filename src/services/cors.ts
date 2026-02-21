
/**
 * CORS Simulation Middleware
 * Adds standard CORS headers to the response object.
 * In a mock environment, this doesn't actually block requests (since it's client-side),
 * but it structures the response as if it were a real Express server.
 */
export const applyCors = (res: any) => {
    // Determine the response object structure (mock vs real)
    if (res && typeof res.setHeader === 'function') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    } else if (res && res.headers) {
        // For our mock response object structure
        res.headers = {
            ...res.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };
    }
    return res;
};
