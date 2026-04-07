// Frontend configuration
// API settings based on platform

import { Platform } from 'react-native';

const API_IP = process.env.API_IP || '10.12.138.232';
const API_PORT = process.env.API_PORT || '8000';

export const API_BASE_URL = `http://${API_IP}:${API_PORT}`;
export const API_TIMEOUT = 30000;