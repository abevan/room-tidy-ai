import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.25c72393afd94650a68d7ec2a8f601a8',
  appName: 'room-tidy-ai',
  webDir: 'dist',
  server: {
    url: 'https://25c72393-afd9-4650-a68d-7ec2a8f601a8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#8B5CF6'
    },
    App: {
      launchShowDuration: 0
    }
  }
};

export default config;