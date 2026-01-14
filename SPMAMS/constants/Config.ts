import { Platform } from 'react-native';

const LOCAL_IP = '10.166.68.253'; 
const PORT = '3000';

export const API_URL = Platform.select({
    android: `http://${LOCAL_IP}:${PORT}/api`,
    ios: `http://${LOCAL_IP}:${PORT}/api`,
    
    default: `http://localhost:${PORT}/api`,
});