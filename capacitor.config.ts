import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amix.app',
  appName: 'Amix',
  // Веб-часть лежит в папке www/ (webDir: '.' скопировал бы в приложение
  // и node_modules, и саму папку android/)
  webDir: 'www',
  loggingBehavior: 'debug',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#000000',
    useLegacyBridge: false
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.amix.local'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#000000',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000'
    }
  }
};

export default config;
