// This service provides functions for the developer tools screen
// to inspect the state of the mock database.
import { getRawDb } from './database';

export const getDatabaseState = (): Record<string, any[]> => {
  return getRawDb();
};
