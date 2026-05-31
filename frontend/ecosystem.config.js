module.exports = {
  apps: [{
    name: "frontend",
    script: "npx",
    args: "next start -p 3101",
    cwd: "/root/dolphin-community/frontend",
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
    },
    max_restarts: 5,
    min_uptime: "10s",
    kill_timeout: 5000,
  }]
};
