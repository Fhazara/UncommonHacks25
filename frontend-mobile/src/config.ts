import { Platform } from 'react-native';

// Use your actual IP address for both iOS and Android physical devices
export const API_URL = 'http://172.16.1.97:8001';

// The following is the default config which works for simulators/emulators
// export const API_URL = Platform.select({
//   ios: 'http://localhost:8000',  // Use localhost for iOS simulator
//   android: 'http://10.0.2.2:8000', // Android emulator uses this special IP for localhost
//   default: 'http://localhost:8000',
// }); 