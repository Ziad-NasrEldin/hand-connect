import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.herafy-eg.app',
  appName: 'Herafy',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
