import { describe, it, expect } from 'bun:test';
import { MemoryStorageDriver } from '../src/storage/drivers/MemoryStorageDriver';
import { WebStorageDriver } from '../src/storage/drivers/WebStorageDriver';
import { NativeAsyncStorageDriver } from '../src/storage/drivers/NativeAsyncStorageDriver';
import { UniversalStorage } from '../src/storage/storageAdapter';

describe('Storage Drivers Unit Tests', () => {
  it('MemoryStorageDriver should store, retrieve, and delete items', async () => {
    const memory = new MemoryStorageDriver();
    await memory.setItem('key1', 'val1');
    expect(await memory.getItem('key1')).toBe('val1');
    expect(await memory.getItem('nonexistent')).toBeNull();

    const keys = await memory.getAllKeys();
    expect(keys).toContain('key1');

    await memory.removeItem('key1');
    expect(await memory.getItem('key1')).toBeNull();
  });

  it('UniversalStorage should allow dynamic driver injection', async () => {
    const customMemory = new MemoryStorageDriver();
    const customStorage = new UniversalStorage(customMemory);

    await customStorage.setItem('test_param', 'hello_world');
    expect(await customMemory.getItem('test_param')).toBe('hello_world');
    expect(await customStorage.getItem('test_param')).toBe('hello_world');
  });

  it('WebStorageDriver should fallback to memory driver when localStorage is undefined', async () => {
    const webDriver = new WebStorageDriver();
    await webDriver.setItem('fallback_key', 'fallback_val');
    expect(await webDriver.getItem('fallback_key')).toBe('fallback_val');
  });

  it('NativeAsyncStorageDriver should store and retrieve items with fallback support', async () => {
    const nativeDriver = new NativeAsyncStorageDriver();
    await nativeDriver.setItem('native_key', 'native_val');
    expect(await nativeDriver.getItem('native_key')).toBe('native_val');

    const allKeys = await nativeDriver.getAllKeys();
    expect(allKeys).toContain('native_key');

    await nativeDriver.removeItem('native_key');
    expect(await nativeDriver.getItem('native_key')).toBeNull();
  });
});
