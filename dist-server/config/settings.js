const settings = {
    port: Number(process.env.PORT) || 3000,
    https_port: Number(process.env.HTTPS_PORT) || 3001,
    node_env: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI || 'mongodb://appuser:adriano123@72.60.249.175:27017/appdb?authSource=admin',
    jwtSecret: process.env.JWT_SECRET || 'a_default_secret_that_should_not_be_used',
    srsApiUrl: process.env.SRS_API_URL || 'http://72.60.249.175:1985'
};
export default settings;
