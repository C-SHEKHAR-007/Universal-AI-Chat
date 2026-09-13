import { IStorageDriver } from './IStorageDriver';

export class MemoryStorageDriver implements IStorageDriver {
  private memoryCache: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.memoryCache.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.memoryCache.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.memoryCache.keys());
  }
}
