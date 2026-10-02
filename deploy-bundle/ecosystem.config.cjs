module.exports = {
  apps: [
    {
      name: "vay365-web",
      script: "./apps/web/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      node_args: ["--max-old-space-size=512"],
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: 3000,
      },
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
    },
  ],
};
