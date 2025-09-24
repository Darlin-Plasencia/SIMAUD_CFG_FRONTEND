import { afterAll, afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mockeamos el SDK de Supabase para observar cómo se inicializa el cliente
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {}
  }))
}));

const ORIGINAL_ENV = { ...process.env };
let createClientMock: jest.Mock;

beforeEach(async () => {
  jest.resetModules(); // Garantiza que importemos una versión fresca del módulo en cada prueba
  process.env = { ...ORIGINAL_ENV }; // Restauramos variables de entorno conocidas
  const supabaseModule = await import('@supabase/supabase-js');
  createClientMock = supabaseModule.createClient as jest.Mock;
  createClientMock.mockClear();
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  process.env = ORIGINAL_ENV; // Devolvemos el entorno al estado original tras todas las pruebas
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
    ); // Verificamos que el cliente se configure con las opciones de autenticación esperadas

    expect(module.supabase).toBeDefined(); // El m�dulo debe exponer el cliente instanciado
  });

  it('throws a descriptive error when required environment variables are missing', async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(import('../lib/supabase')).rejects.toThrow('Missing Supabase environment variables'); // Sin credenciales, el módulo debe fallar

    expect(errorSpy).toHaveBeenCalled(); // Se espera un log explicativo en consola

    errorSpy.mockRestore();
  });
});
