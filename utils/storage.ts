import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { WooCommerceSettings, MakeSettings } from './types';

// Helper function to handle web storage
const webStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting localStorage:', error);
      throw error; // Propagate error for proper handling
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      throw error;
    }
  },
};

// Use appropriate storage based on platform
const storage = Platform.OS === 'web' ? webStorage : SecureStore;

export async function getStoredSettings<T>(key: string): Promise<T | null> {
  try {
    const value = await storage.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error getting ${key} settings:`, error);
    return null;
  }
}

export async function storeSettings<T>(key: string, value: T | null): Promise<void> {
  try {
    if (value === null) {
      await storage.removeItem(key);
    } else {
      await storage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error saving ${key} settings:`, error);
    throw new Error('Failed to save settings');
  }
}

// Specific functions for WooCommerce settings
export async function getWooCommerceSettings(): Promise<WooCommerceSettings | null> {
  return getStoredSettings<WooCommerceSettings>('woocommerce_settings');
}

export async function saveWooCommerceSettings(settings: WooCommerceSettings): Promise<void> {
  return storeSettings('woocommerce_settings', settings);
}

// Specific functions for Make settings
export async function getMakeSettings(): Promise<MakeSettings | null> {
  return getStoredSettings<MakeSettings>('make_settings');
}

export async function saveMakeSettings(settings: MakeSettings): Promise<void> {
  return storeSettings('make_settings', settings);
}