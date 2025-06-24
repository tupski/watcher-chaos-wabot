module.exports = {
  apps: [{
    name: 'bot-lords-mobile',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
