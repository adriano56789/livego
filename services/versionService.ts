import type { VersionInfo } from '../types';
import { apiClient } from './apiClient';

export const CURRENT_APP_VERSION = '1.0.0';

/**
 * Simulates fetching version information from a backend API.
 * @returns A promise that resolves with the version information.
 */
export const checkVersion = (): Promise<VersionInfo> => {
  console.log(`[VersionService] Current app version is ${CURRENT_APP_VERSION}. Checking for updates...`);
  return apiClient('/api/version');
};
