import { IStorageDriver } from './IStorageDriver';
import { MemoryStorageDriver } from './MemoryStorageDriver';

/**
 * Cross-platform Native AsyncStorage driver for iOS and Android.
 * Dynamically loads @react-native-async-storage/async-storage for persistent
 * native storage on device, with seamless memory fallback for test environments.
 */
export class NativeAsyncStorageDriver implements IStorageDriver {
  private fallback = new MemoryStorageDriver();
  private asyncStorageModule: any = null;
  private hasCheckedModule = false;

  private async getStorageModule(): Promise<any> {
    if (this.hasCheckedModule) return this.asyncStorageModule;
    try {
      const mod = await import('@react-native-async-storage/async-storage');
      this.asyncStorageModule = mod.default || mod;
    } catch {
      this.asyncStorageModule = null;
    } finally {
      this.hasCheckedModule = true;
    }
    return this.asyncStorageModule;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const storage = await this.getStorageModule();
      if (storage && typeof storage.getItem === 'function') {
        const val = await storage.getItem(key);
        return val;
      }
    } catch {
      // Graceful fallback
    }
    return this.fallback.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const storage = await this.getStorageModule();
      if (storage && typeof storage.setItem === 'function') {
        await storage.setItem(key, value);
        return;
      }
    } catch {
      // Graceful fallback
    }
    await this.fallback.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    try {
      const storage = await this.getStorageModule();
      if (storage && typeof storage.removeItem === 'function') {
        await storage.removeItem(key);
        return;
      }
    } catch {
      // Graceful fallback
    }
    await this.fallback.removeItem(key);
  }

  async clear(): Promise<void> {
    try {
      const storage = await this.getStorageModule();
      if (storage && typeof storage.clear === 'function') {
        await storage.clear();
        return;
      }
    } catch {
      // Graceful fallback
    }
    await this.fallback.clear();
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const storage = await this.getStorageModule();
      if (storage && typeof storage.getAllKeys === 'function') {
        const keys = await storage.getAllKeys();
        return [...keys];
      }
    } catch {
      // Graceful fallback
    }
    return this.fallback.getAllKeys();
  }
}
