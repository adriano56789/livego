import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.livego.app',
  appName: 'LiveGo',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config