import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// API URL for the frontend to use
export const API_URL = `http://${localIP}:8000`;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow connections from any IP
    port: 3000,
    proxy: {
      '/api': {
        target: `http://${localIP}:8000`,
        changeOrigin: true,
      },
    },
  },
}); 