import '@testing-library/jest-dom/vitest';

const memoryStorage = new Map<string, string>();

function createMemoryStorage(): Storage {
  return {
    get length() {
      return memoryStorage.size;
    },
    clear: () => memoryStorage.clear(),
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
  };
}

if (!globalThis.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
}

if (!globalThis.sessionStorage) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
}
