import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';
import { Platform } from 'react-native';

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name] || []) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

export const API_URL = Platform.select({
  ios: 'http://YOUR_IP_ADDRESS:8000', // Replace with your actual IP address
  android: 'http://YOUR_IP_ADDRESS:8000', // Replace with your actual IP address
  default: 'http://localhost:8000',
});

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow connections from any IP
    port: 3000,
    proxy: {
      '/api': {
        target: `http://${getLocalIP()}:8000`,
        changeOrigin: true,
      },
    },
  },
}); 