import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const USERS = {
  manager: {
    password: '23Kebaby',
    role: 'manager'
  },
  lustyk: {
    password: 'Kurwamac1313',
    role: 'owner'
  }
};

const AUTH_KEY = 'auth_data';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface AuthData {
  username: string;
  role: string;
  timestamp: number;
}

// Helper function for web storage
const webStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    window.localStorage.removeItem(key);
  },
};

const storage = Platform.OS === 'web' ? webStorage : SecureStore;

export async function login(username: string, password: string): Promise<AuthData | null> {
  const user = USERS[username as keyof typeof USERS];
  
  if (!user || user.password !== password) {
    return null;
  }

  const authData: AuthData = {
    username,
    role: user.role,
    timestamp: Date.now()
  };

  await storage.setItem(AUTH_KEY, JSON.stringify(authData));
  return authData;
}

export async function logout(): Promise<void> {
  await storage.removeItem(AUTH_KEY);
}

export async function checkAuth(): Promise<AuthData | null> {
  const data = await storage.getItem(AUTH_KEY);
  if (!data) return null;

  const authData: AuthData = JSON.parse(data);
  const now = Date.now();
  
  // Check if token has expired (24 hours)
  if (now - authData.timestamp > TOKEN_EXPIRY) {
    await logout();
    return null;
  }

  return authData;
}