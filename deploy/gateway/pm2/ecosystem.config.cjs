module.exports = {
  apps: [
    {
      name: "castle-gateway",
      cwd: "/opt/castle/apps/gateway",
      script: "src/server.js",
      node_args: "--enable-source-maps",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
