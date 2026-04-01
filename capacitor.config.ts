import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'tech.baseapp.app',
  appName: 'BASE',
  webDir: 'www',
  server: {
    url: 'https://base-app.tech/app.html',
    cleartext: false
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0f110f',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f110f'
    }
  }
};

export default config;
