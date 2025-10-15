import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7d9ab1da39d143f6a1c73463d3d4225b',
  appName: 'clerk-portapro',
  webDir: 'dist',
  server: {
    url: "https://7d9ab1da-39d1-43f6-a1c7-3463d3d4225b.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    BarcodeScanner: {
      cameraDirection: 'back'
    }
  }
};

export default config;