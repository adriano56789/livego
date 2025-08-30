import { apiClient } from './apiClient';

export interface HealthCheckResult {
    endpoint: string;
    method: string;
    status: 'OK' | 'NOT_FOUND' | 'ERROR';
    details: string;
}

/**
 * Calls the API health check endpoint to monitor the status of all critical endpoints.
 * @returns A promise that resolves with an array of health check results.
 */
export const checkApiHealth = (): Promise<HealthCheckResult[]> => {
    return apiClient('/api/monitor/health-check');
};

/**
 * Calls the API diagnostics endpoint to perform a full system test.
 * @returns A promise that resolves with a JSON object containing the text report.
 */
export const runFullDiagnosticsTest = (): Promise<{ report: string }> => {
    return apiClient('/api/diagnostics/full-test');
};
