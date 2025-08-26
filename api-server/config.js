// Simulate environment variables
// In a real production environment, these would be loaded from .env files or system environment variables.
const config = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/livego',
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || 'devkey',
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET || 'secret',
};

module.exports = config;
