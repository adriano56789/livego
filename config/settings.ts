const settings = {
    port: Number(process.env.PORT) || 3000,
    https_port: Number(process.env.HTTPS_PORT) || 3001,
    node_env: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/api',
    jwtSecret: process.env.JWT_SECRET || 'a_default_secret_that_should_not_be_used'
};

export default settings;
