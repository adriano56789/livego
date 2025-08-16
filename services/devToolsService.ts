// This service provides functions for the developer tools screen
// to inspect the state of the mock database.
import { dbClient } from './dbClient';

export const getDatabaseState = (): Record<string, any> => {
  return dbClient.getRawDb();
};