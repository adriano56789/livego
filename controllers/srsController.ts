// FIX: Changed import to use the express namespace to avoid type conflicts.
import express from 'express';
import config from '../config/settings.js';

/**
 * Helper function to proxy requests to the real SRS API.
 * This replaces the previous mock implementation by forwarding requests to a configurable SRS server URL.
 */
const proxyToSrs = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Construct the target URL. req.url contains the path and query string after the mount point.
    // e.g., for a request to /api/v1/clients?start=10, req.url will be /v1/clients?start=10
    const srsUrl = `${config.srsApiUrl}/api${req.url}`;

    console.log(`[SRS PROXY] Forwarding ${req.method} request to: ${srsUrl}`);

    try {
        const srsResponse = await fetch(srsUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            // Forward body only for methods that typically have one.
            body: (req.method !== 'GET' && req.method !== 'HEAD' && Object.keys(req.body).length > 0) 
                  ? JSON.stringify(req.body) 
                  : undefined,
        });

        // Try to parse JSON, but handle cases where SRS might send an empty or non-JSON response.
        const responseText = await srsResponse.text();
        const responseData = responseText ? JSON.parse(responseText) : {};

        // Forward the status code and the body from the SRS server directly.
        return res.status(srsResponse.status).json(responseData);

    } catch (error: unknown) {
        const errorMessage = `Failed to connect to SRS server at ${config.srsApiUrl}. Is it running and accessible?`;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[SRS PROXY] Network error while contacting SRS server:`, errorMsg);
        // Use 502 Bad Gateway for proxy errors
        return res.status(502).json({
            code: -1,
            message: errorMessage,
            error: errorMsg
        });
    }
};

// All SRS controller functions now use the proxy helper, replacing the mock data.
export const srsController = {
    getVersions: proxyToSrs,
    getSummaries: proxyToSrs,
    getFeatures: proxyToSrs,
    getClients: proxyToSrs,
    getClientById: proxyToSrs,
    getStreams: proxyToSrs,
    getStreamById: proxyToSrs,
    deleteStreamById: proxyToSrs,
    getConnections: proxyToSrs,
    getConnectionById: proxyToSrs,
    deleteConnectionById: proxyToSrs,
    getConfigs: proxyToSrs,
    updateConfigs: proxyToSrs,
    getVhosts: proxyToSrs,
    getVhostById: proxyToSrs,
    getRequests: proxyToSrs,
    getSessions: proxyToSrs,
    getMetrics: proxyToSrs,
    rtcPublish: proxyToSrs,
    trickleIce: proxyToSrs,
};