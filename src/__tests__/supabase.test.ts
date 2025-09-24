import { afterAll, afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {}
  }))
}));

const ORIGINAL_ENV = { ...process.env };

const clearOverride = () => {
  delete (globalThis as Record<string, unknown>).__SUPABASE_ENV__;
};

let createClientMock: jest.Mock;

beforeEach(async () => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  clearOverride();

  const supabaseModule = await import('@supabase/supabase-js');
  createClientMock = supabaseModule.createClient as jest.Mock;
  createClientMock.mockClear();
});

afterEach(() => {
  jest.clearAllMocks();
  clearOverride();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
  clearOverride();
});

describe('supabase client configuration', () => {
  it('creates the Supabase client with the provided environment variables', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';

    const module = await import('../lib/supabase');

    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'simaud-auth'
        })
      })
    );

    expect(module.supabase).toBeDefined();
  });

  it('respects a global override for tests', async () => {
    (globalThis as Record<string, unknown>).__SUPABASE_ENV__ = {
      VITE_SUPABASE_URL: 'https://meta.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'meta-anon-key',
      NODE_ENV: 'development',
      MODE: 'development'
    };

    const module = await import('../lib/supabase');

    expect(createClientMock).toHaveBeenCalledWith(
      'https://meta.supabase.co',
      'meta-anon-key',
      expect.any(Object)
    );

    expect(module.supabase).toBeDefined();
  });

  it('avoids logging initialization even outside the test environment', async () => {
    (globalThis as Record<string, unknown>).__SUPABASE_ENV__ = {
      VITE_SUPABASE_URL: 'https://staging.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'staging-anon',
      NODE_ENV: 'development',
      MODE: 'development',
      JEST_WORKER_ID: undefined
    };

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await import('../lib/supabase');

    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it('throws a descriptive error when required environment variables are missing', async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(import('../lib/supabase')).rejects.toThrow('Missing Supabase environment variables');

    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
