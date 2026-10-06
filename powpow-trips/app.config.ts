import type { ExpoConfig } from 'expo/config';

// Google Maps key for Android map tiles. Set it in your shell or EAS secrets:
//   GOOGLE_MAPS_API_KEY=xxxx npx expo run:android
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? '';

const config: ExpoConfig = {
  name: 'PowPow Trips',
  slug: 'powpow-trips',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'powpowtrips',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.powpowtrips.app',
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'PowPow Trips uses your location to show nearby places on the trip map.',
    },
  },
  android: {
    package: 'com.powpowtrips.app',
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/images/splash-icon.png',
        imageWidth: 220,
        dark: { backgroundColor: '#0B1533', image: './assets/images/splash-icon.png' },
      },
    ],
    ['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'PowPow Trips uses your location to show nearby places on the trip map.',
      },
    ],
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
