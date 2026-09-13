import { IStorageDriver } from './IStorageDriver';
import { MemoryStorageDriver } from './MemoryStorageDriver';

export class WebStorageDriver implements IStorageDriver {
  private fallback = new MemoryStorageDriver();

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (this.isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }
    return this.fallback.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
    }
    // Also keep fallback updated in case environment transitions
    await this.fallback.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    }
    await this.fallback.removeItem(key);
  }

  async clear(): Promise<void> {
    if (this.isLocalStorageAvailable()) {
      localStorage.clear();
    }
    await this.fallback.clear();
  }

  async getAllKeys(): Promise<string[]> {
    if (this.isLocalStorageAvailable()) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) keys.push(k);
      }
      return keys;
    }
    return this.fallback.getAllKeys();
  }
}
