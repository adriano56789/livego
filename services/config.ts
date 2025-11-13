// services/config.ts

/**
 * This file contains the configuration for connecting to the MongoDB database.
 * In a real-world scenario, these values would be loaded from environment variables
 * and would not be committed to version control for security reasons.
 */
export const dbConfig = {
  mongodb: {
    url: 'mongodb://localhost:27017/livego',
  }
};