import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowchess.app',
  appName: 'Shadow Chess',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true // Allow plain HTTP API requests to local backend (http://localhost:5000) during development/testing
  }
};

export default config;
