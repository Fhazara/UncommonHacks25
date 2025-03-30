import { Platform } from 'react-native';

// Update to match the actual running backend server port (8000)
export const API_URL = 'http://172.16.4.116:8000';

// Comment out the Platform.select since we'll use a direct IP
// export const API_URL = Platform.select({
//ios: 'http://localhost:8001',      // iOS simulator uses localhost
//   android: 'http://10.0.2.2:8001',   // Android emulator uses 10.0.2.2 for localhost
//   default: 'http://localhost:8001',
// }); 