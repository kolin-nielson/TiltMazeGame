import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import { isDevelopment } from '../config/env';

class StorageService {
  async save<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);

      if (isDevelopment) {
        console.log(`[Storage] Saved data for key: ${key}`);
      }
    } catch (error) {
      console.error(`[Storage] Error saving data for key: ${key}`, error);
      throw error;
    }
  }

  async load<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        if (isDevelopment) {
          console.log(`[Storage] No data found for key: ${key}, using default value`);
        }
        return defaultValue || null;
      }

      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error(`[Storage] Error loading data for key: ${key}`, error);
      return defaultValue || null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);

      if (isDevelopment) {
        console.log(`[Storage] Removed data for key: ${key}`);
      }
    } catch (error) {
      console.error(`[Storage] Error removing data for key: ${key}`, error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);

      if (isDevelopment) {
        console.log(`[Storage] Cleared all app storage`);
      }
    } catch (error) {
      console.error(`[Storage] Error clearing app storage`, error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error(`[Storage] Error getting all keys`, error);
      return [];
    }
  }

  async hasKey(key: string): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.includes(key);
    } catch (error) {
      console.error(`[Storage] Error checking for key: ${key}`, error);
      return false;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
