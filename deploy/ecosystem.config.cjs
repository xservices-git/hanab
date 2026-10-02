module.exports = {
  apps: [{
    name: 'mbvay-web',
    script: 'server.js',
    cwd: 'C:/Users/X/Downloads/mbvay-master (1)/mbvay-master/deploy',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: { NODE_ENV: 'production', HOSTNAME: '0.0.0.0', PORT: 3000 },
    error_file: 'logs/pm2-error.log',
    out_file:   'logs/pm2-out.log',
    time: true,
  }]
};
