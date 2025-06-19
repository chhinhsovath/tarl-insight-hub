module.exports = {
  apps: [{
    name: 'tarl-insight-hub',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    // Auto restart if app crashes
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Monitoring
    instance_var: 'INSTANCE_ID',
    merge_logs: true,
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Environment specific configs
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001
    }
  }]
};