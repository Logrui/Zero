/**
 * Jest Test Setup
 * Global configuration and utilities for the test suite
 */

// Mock Jest globals for development
declare global {
  const jest: {
    setTimeout(timeout: number): void;
    fn<T extends (...args: any[]) => any>(implementation?: T): jest.MockedFunction<T>;
  };
  
  namespace jest {
    interface MockedFunction<T extends (...args: any[]) => any> extends Function {
      (...args: Parameters<T>): ReturnType<T>;
    }
  }
  
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
}

// Global test timeout
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}

// Mock console methods in tests to reduce noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

if (typeof beforeEach !== 'undefined') {
  beforeEach(() => {
    // Suppress expected error/warning logs during tests
    if (typeof jest !== 'undefined') {
      console.error = jest.fn();
      console.warn = jest.fn();
    }
  });
}

if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    // Restore original console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
}

// Global test utilities
(global as any).testUtils = {
  // Helper to wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to generate random strings
  randomString: (length: number = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Helper to generate test data
  generateTestData: (overrides: Record<string, any> = {}) => ({
    id: Math.random().toString(36).substring(7),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  })
};

// Mock fetch globally for tests
if (typeof jest !== 'undefined') {
  (global as any).fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({
        data: {},
        message: 'Success'
      }),
      text: () => Promise.resolve(''),
      headers: new Headers()
    })
  );
}

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/zero_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';

console.log('Test environment configured successfully');

export {};