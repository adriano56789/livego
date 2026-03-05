module.exports = {
  apps: [{
    name: 'livego-backend',
    script: 'dist/server.js',
    cwd: '/var/www/livego/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3000 }
  }]
};
