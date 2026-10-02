module.exports = {
  apps: [
    {
      name: 'mbvay-web',
      cwd: __dirname + '/apps/web',
      script: '../../node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: '3000'
      },
      error_file: '../../logs/pm2-web-error.log',
      out_file: '../../logs/pm2-web-out.log',
      log_file: '../../logs/pm2-web.log',
      time: true,
      restart_delay: 2000,
      max_restarts: 20,
      min_uptime: '10s'
    }
  ]
};
