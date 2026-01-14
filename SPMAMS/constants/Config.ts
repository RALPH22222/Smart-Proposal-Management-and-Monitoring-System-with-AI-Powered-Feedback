import { Platform } from 'react-native';

const LOCAL_IP = '10.166.68.253'; 

const PORT = '8000'; 
export const API_URL = Platform.select({
    android: `http://${LOCAL_IP}:${PORT}`,
    ios: `http://${LOCAL_IP}:${PORT}`,
    default: `http://localhost:${PORT}`,
});