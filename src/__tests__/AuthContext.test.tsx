import '@testing-library/jest-dom/jest-globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Definiciones de tipos
// Tipos base
interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  user_metadata: {
    name: string;
    role: string;
    phone?: string;
    cedula?: string;
  };
}

interface AuthSession {
  user: AuthUser;
}

// Tipos de respuesta
interface AuthResponse {
  data: { user: AuthUser | null };
  error: null | { message: string };
}

interface SessionResponse {
  data: { session: AuthSession | null };
  error: null | { message: string };
}

// Tipos de funciones de autenticación
type SignInCredentials = { email: string; password: string };
type SignInFunction = (credentials: SignInCredentials) => Promise<AuthResponse>;
type SignOutFunction = () => Promise<void>;
type SignUpData = {
  name: string;
  email: string;
  phone: string;
  cedula: string;
  password: string;
  confirmPassword: string;
};

type SignUpFunction = (data: SignUpData) => Promise<AuthResponse>;
type ResendFunction = () => Promise<{ error: null | { message: string } }>;
type GetSessionFunction = () => Promise<SessionResponse>;
type OnAuthStateChangeFunction = (callback: AuthCallback) => { data: { subscription: { unsubscribe: () => void } } };
type GetUserFunction = () => Promise<AuthResponse>;

// Mock de usuario para pruebas de registro
const newUser: AuthUser = {
  id: 'new-user-id',
  email: 'user@example.com',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  user_metadata: {
    name: 'New Test User',
    role: 'user',
    phone: '1234567890',
    cedula: '123456789'
  }
};

// Tipo de callback de autenticación
type AuthCallback = (event: string, session: { user: AuthUser | null }) => void | Promise<void>;

// Tipo del módulo de autenticación
type AuthModule = typeof import('../contexts/AuthContext');

// Variables del módulo
let AuthProvider: AuthModule['AuthProvider'];
let useAuth: AuthModule['useAuth'];
let authStateCallback: AuthCallback | undefined;

// Mock del usuario de autenticación
const mockAuthUser: AuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  user_metadata: {
    name: 'Test User',
    role: 'user',
    phone: '8091234567',
    cedula: '40212345678'
  }
};

// Mocks tipados para las funciones de autenticación
const signInWithPassword = jest.fn() as jest.MockedFunction<SignInFunction>;
const signOut = jest.fn() as jest.MockedFunction<SignOutFunction>;
const signUp = jest.fn() as jest.MockedFunction<SignUpFunction>;
const resend = jest.fn() as jest.MockedFunction<ResendFunction>;
const getSession = jest.fn() as jest.MockedFunction<GetSessionFunction>;
const onAuthStateChange = jest.fn() as jest.MockedFunction<OnAuthStateChangeFunction>;
const getUser = jest.fn() as jest.MockedFunction<GetUserFunction>;
const fromMock = jest.fn();

// Tipos para las respuestas del queryBuilder
interface QueryResponse<T> {
  data: T | null;
  error: null | { message: string };
}

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  cedula: string;
  role: string;
}

// Tipos para el queryBuilder y sus mocks
interface QueryBuilderMock {
  select: jest.MockedFunction<() => QueryBuilderMock>;
  eq: jest.MockedFunction<() => QueryBuilderMock>;
  single: jest.MockedFunction<() => Promise<QueryResponse<UserProfile>>>;
}

let queryBuilder: QueryBuilderMock;

function buildQueryBuilder(): QueryBuilderMock {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn()
  } as QueryBuilderMock;
  
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.single.mockResolvedValue({ data: null, error: null });
  
  return builder;
}

beforeAll(async () => {
  // Configuración inicial de los mocks
  signInWithPassword.mockResolvedValue({
    data: { user: mockAuthUser },
    error: null
  });

  signOut.mockResolvedValue();

  signUp.mockResolvedValue({
    data: { user: mockAuthUser },
    error: null
  });

  resend.mockResolvedValue({
    error: null
  });

  getSession.mockResolvedValue({
    data: { session: { user: mockAuthUser } },
    error: null
  });

  getUser.mockResolvedValue({
    data: { user: mockAuthUser },
    error: null
  });

  await jest.unstable_mockModule('../lib/supabase', () => ({
    supabase: {
      auth: {
        signInWithPassword,
        signOut,
        signUp,
        resend,
        getSession,
        onAuthStateChange,
        getUser
      },
      from: fromMock
    }
  }));

  const authModule = await import('../contexts/AuthContext');
  AuthProvider = authModule.AuthProvider;
  useAuth = authModule.useAuth;
});

beforeEach(() => {
  jest.clearAllMocks();

  getSession.mockResolvedValue({ data: { session: null }, error: null });
  authStateCallback = undefined;
  onAuthStateChange.mockImplementation((callback: AuthCallback) => {
    if (typeof callback === 'function') {
      authStateCallback = callback as (event: string, session: { user: AuthUser | null }) => void;
    }
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
  (getUser as jest.Mock).mockReturnValue(Promise.resolve({ data: { user: null }, error: null }));

  (signInWithPassword as jest.Mock).mockReturnValue(Promise.resolve({ data: { user: null }, error: null }));
  (signOut as jest.Mock).mockReturnValue(Promise.resolve({}));
  (signUp as jest.Mock).mockReturnValue(Promise.resolve({ data: { user: null }, error: null }));
  (resend as jest.Mock).mockReturnValue(Promise.resolve({ error: null }));

  queryBuilder = buildQueryBuilder();
  fromMock.mockReturnValue(queryBuilder);
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).__AUTH_REDIRECT__;
});

const renderAuthHook = async () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current).toBeDefined());
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook.result;
};

const buildAuthUser = (overrides: Partial<AuthUser> = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  user_metadata: { name: 'User', role: 'user', ...overrides.user_metadata },
  ...overrides
});

describe('AuthContext', () => {
  describe('login()', () => {
    it('maps Supabase auth errors to friendly messages', async () => {
      signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      });

      const auth = await renderAuthHook();
      let response: Awaited<ReturnType<typeof auth.current.login>>;

      await act(async () => {
        response = await auth.current.login({
          email: 'user@example.com',
          password: 'wrong-password'
        });
      });

      expect(response!).toEqual({
        success: false,
        error: 'Email o contrase\u00f1a incorrectos. Por favor verifica tus datos.'
      });
    });

    it('returns success when the user has confirmed the email', async () => {
      signInWithPassword.mockResolvedValue({
        data: { user: buildAuthUser() },
        error: null
      });

      const auth = await renderAuthHook();

      let response: Awaited<ReturnType<typeof auth.current.login>>;
      await act(async () => {
        response = await auth.current.login({
          email: 'user@example.com',
          password: 'secret-123'
        });
      });

      expect(response!).toEqual({ success: true });
    });

    it('forces sign out and surfaces guidance when the email is unconfirmed', async () => {
      signInWithPassword.mockResolvedValue({
        data: { user: buildAuthUser({ email_confirmed_at: null }) },
        error: null
      });

      const auth = await renderAuthHook();
      let response: Awaited<ReturnType<typeof auth.current.login>>;

      await act(async () => {
        response = await auth.current.login({
          email: 'user@example.com',
          password: 'secret-123'
        });
      });

      expect(signOut).toHaveBeenCalled();
      expect(response!).toEqual({
        success: false,
        error: 'Debes confirmar tu email antes de iniciar sesi\u00f3n. Revisa tu bandeja de entrada.'
      });
    });

    it('returns a connection error when the login attempt rejects', async () => {
      signInWithPassword.mockRejectedValue(new Error('connection timeout'));

      const auth = await renderAuthHook();
      let response: Awaited<ReturnType<typeof auth.current.login>>;

      await act(async () => {
        response = await auth.current.login({
          email: 'user@example.com',
          password: 'secret-123'
        });
      });

      expect(response!).toEqual({
        success: false,
        error: 'Error de conexi\u00f3n. Intenta de nuevo.'
      });
    });

    it('falls back to a generic message for unknown Supabase errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unhandled error' }
      });

      const auth = await renderAuthHook();
      let response: Awaited<ReturnType<typeof auth.current.login>>;

      await act(async () => {
        response = await auth.current.login({
          email: 'user@example.com',
          password: 'secret-123'
        });
      });

      expect(response!).toEqual({
        success: false,
        error: 'Error al iniciar sesi\u00f3n. Por favor intenta nuevamente.'
      });
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('initialization and realtime events', () => {
    it('hydrates the user when a confirmed session already exists', async () => {
      getSession.mockResolvedValue({ data: { session: { user: mockAuthUser } }, error: null });
      queryBuilder.single.mockResolvedValue({
        data: {
          id: mockAuthUser.id,
          name: mockAuthUser.user_metadata.name,
          phone: mockAuthUser.user_metadata.phone || '',
          cedula: mockAuthUser.user_metadata.cedula || '',
          role: mockAuthUser.user_metadata.role
        },
        error: null
      });

      const auth = await renderAuthHook();

      await waitFor(() => expect(auth.current.user?.role).toBe(mockAuthUser.user_metadata.role));
      expect(auth.current.isAuthenticated).toBe(true);
    });

    it('logs out when the session user has not confirmed the email', async () => {
      const unconfirmedUser = {
        ...mockAuthUser,
        email_confirmed_at: null
      };
      getSession.mockResolvedValue({ data: { session: { user: unconfirmedUser } }, error: null });

      const auth = await renderAuthHook();

      await waitFor(() => expect(auth.current.isAuthenticated).toBe(false));
      expect(auth.current.isUpdatingRole).toBe(false);
    });

    it('handles SIGNED_IN events from Supabase auth', async () => {
      queryBuilder.single.mockResolvedValue({
        data: {
          id: mockAuthUser.id,
          name: 'Signed In User',
          phone: '8090000000',
          cedula: '00123456789',
          role: 'admin'
        },
        error: null
      });

      const auth = await renderAuthHook();
      await act(async () => {
        await authStateCallback?.('SIGNED_IN', { user: mockAuthUser });
      });

      await waitFor(() => expect(auth.current.user?.name).toBe('Signed In User'));
      expect(auth.current.isAuthenticated).toBe(true);
    });

    it('handles SIGNED_OUT events by clearing authentication state', async () => {
      queryBuilder.single.mockResolvedValue({
        data: {
          id: mockAuthUser.id,
          name: mockAuthUser.user_metadata.name,
          phone: mockAuthUser.user_metadata.phone || '',
          cedula: mockAuthUser.user_metadata.cedula || '',
          role: 'admin'
        },
        error: null
      });

      const auth = await renderAuthHook();
      await act(async () => {
        await authStateCallback?.('SIGNED_IN', { user: mockAuthUser });
      });
      await waitFor(() => expect(auth.current.isAuthenticated).toBe(true));

      await act(async () => {
        await authStateCallback?.('SIGNED_OUT', { user: null });
      });

      expect(auth.current.isAuthenticated).toBe(false);
      expect(auth.current.isUpdatingRole).toBe(false);
    });

  });

  describe('refreshUserProfile()', () => {
    it('merges remote profile attributes when they exist', async () => {
      getUser.mockResolvedValue({ data: { user: mockAuthUser }, error: null });
      queryBuilder.single.mockResolvedValue({
        data: {
          id: mockAuthUser.id,
          name: 'Profile Name',
          phone: '8091234567',
          cedula: '40212345678',
          role: 'admin'
        },
        error: null
      });

      const auth = await renderAuthHook();

      await act(async () => {
        await auth.current.refreshUserProfile();
      });

      await waitFor(() => expect(auth.current.user?.role).toBe('admin'));
      expect(auth.current.user?.name).toBe('Profile Name');
    });

    it('stops updating when Supabase returns no authenticated user', async () => {
      getUser.mockResolvedValue({ data: { user: null }, error: null });

      const auth = await renderAuthHook();

      await act(async () => {
        await auth.current.refreshUserProfile();
      });

      expect(auth.current.isUpdatingRole).toBe(false);
    });
  });

  describe('register()', () => {
    const newUser: AuthUser = {
      id: 'new-user-id',
      email: 'user@example.com',
      email_confirmed_at: '2023-01-01T00:00:00Z',
      created_at: '2023-01-01T00:00:00Z',
      user_metadata: {
        name: 'New Test User',
        role: 'user',
        phone: '1234567890',
        cedula: '123456789'
      }
    };

    it('propagates Supabase validation errors', async () => {
      signUp.mockResolvedValue({
        data: { user: newUser },
        error: { message: 'User already registered' }
      });

      const auth = await renderAuthHook();
      let response: Awaited<ReturnType<typeof auth.current.register>>;

      await act(async () => {
        response = await auth.current.register({
          name: 'New Test User',
          email: 'user@example.com',
          phone: '1234567890',
          cedula: 'ABC123456',
          password: 'Secure#123',
          confirmPassword: 'Secure#123'
        });
      });

      expect(response!).toEqual({
        success: false,
        error: 'Este email ya est\u00e1 registrado. \u00bfOlvidaste tu contrase\u00f1a?'
      });
    });

    it('marks the email as pending confirmation after success', async () => {
      signUp.mockResolvedValue({
        data: { user: newUser },
        error: null
      });

      const auth = await renderAuthHook();

      await act(async () => {
        await auth.current.register({
          name: 'New User',
          email: 'user@example.com',
          phone: '1234567890',
          cedula: 'ABC123456',
          password: 'Secure#123',
          confirmPassword: 'Secure#123'
        });
      });

      await waitFor(() => expect(auth.current.pendingEmailConfirmation).toBe(true));
      expect(auth.current.pendingEmail).toBe('user@example.com');
    });

    it('returns a fallback error when Supabase returns no user', async () => {
      signUp.mockResolvedValue({ data: { user: null }, error: null });

      const auth = await renderAuthHook();
      let response: Awaited<ReturnType<typeof auth.current.register>>;

      await act(async () => {
        response = await auth.current.register({
          name: 'New User',
          email: 'user@example.com',
          phone: '1234567890',
          cedula: 'ABC123456',
          password: 'Secure#123',
          confirmPassword: 'Secure#123'
        });
      });

      expect(response!).toEqual({
        success: false,
        error: 'Error inesperado durante el registro'
      });
    });

    it('returns a connection error when signUp throws', async () => {
      signUp.mockRejectedValue(new Error('network down'));

      const auth = await renderAuthHook();
      let response: Awaited<ReturnType<typeof auth.current.register>>;

      await act(async () => {
        response = await auth.current.register({
          name: 'New User',
          email: 'user@example.com',
          phone: '1234567890',
          cedula: 'ABC123456',
          password: 'Secure#123',
          confirmPassword: 'Secure#123'
        });
      });

      expect(response!).toEqual({ success: false, error: 'network down' });
    });
  });

  describe('resendConfirmation()', () => {
    const newUser: AuthUser = {
      id: 'resend-user-id',
      email: 'user@example.com',
      email_confirmed_at: '2023-01-01T00:00:00Z',
      created_at: '2023-01-01T00:00:00Z',
      user_metadata: {
        name: 'Test Resend User',
        role: 'user',
        phone: '1234567890',
        cedula: '123456789'
      }
    };

    it('fails when there is no pending email', async () => {
      const auth = await renderAuthHook();

      let response: Awaited<ReturnType<typeof auth.current.resendConfirmation>>;
      await act(async () => {
        response = await auth.current.resendConfirmation();
      });

      expect(response!).toEqual({
        success: false,
        error: 'No hay email pendiente de confirmaci\u00f3n'
      });
    });

    it('surfaces Supabase errors when present', async () => {
      signUp.mockResolvedValue({
        data: { user: newUser },
        error: null
      });
      resend.mockResolvedValue({ error: { message: 'User not found' } });

      const auth = await renderAuthHook();

      await act(async () => {
        await auth.current.register({
          name: newUser.user_metadata.name,
          email: newUser.email,
          phone: newUser.user_metadata.phone || '',
          cedula: newUser.user_metadata.cedula || '',
          password: 'Secure#123',
          confirmPassword: 'Secure#123'
        });
      });

      let response: Awaited<ReturnType<typeof auth.current.resendConfirmation>>;
      await act(async () => {
        response = await auth.current.resendConfirmation();
      });

      expect(response!).toEqual({
        success: false,
        error: 'No existe una cuenta con este email. \u00bfTe gustar\u00eda registrarte?'
      });
    });

    it('returns success when Supabase sends the email without error', async () => {
      signUp.mockResolvedValue({
        data: { user: newUser },
        error: null
      });

      const auth = await renderAuthHook();

      await act(async () => {
        await auth.current.register({
          name: newUser.user_metadata.name,
          email: newUser.email,
          phone: newUser.user_metadata.phone || '',
          cedula: newUser.user_metadata.cedula || '',
          password: 'Secure#123',
          confirmPassword: 'Secure#123'
        });
      });

      let response: Awaited<ReturnType<typeof auth.current.resendConfirmation>>;
      await act(async () => {
        response = await auth.current.resendConfirmation();
      });

      expect(response!).toEqual({ success: true });
    });

    it('falls back to a friendly message when resend throws', async () => {
      signUp.mockResolvedValue({
        data: { user: newUser },
        error: null
      });
      resend.mockRejectedValue(new Error('smtp down'));

      const auth = await renderAuthHook();

      await act(async () => {
        await auth.current.register({
          name: newUser.user_metadata.name,
          email: newUser.email,
          phone: newUser.user_metadata.phone || '',
          cedula: newUser.user_metadata.cedula || '',
          password: 'Secure#123',
          confirmPassword: 'Secure#123'
        });
      });

      let response: Awaited<ReturnType<typeof auth.current.resendConfirmation>>;
      await act(async () => {
        response = await auth.current.resendConfirmation();
      });

      expect(response!).toEqual({
        success: false,
        error: 'Error al reenviar el email de confirmaci\u00f3n'
      });
    });
  });

  it('clears the pending confirmation state on demand', async () => {
      signUp.mockResolvedValue({
        data: { user: newUser },
        error: null
      });    const auth = await renderAuthHook();

    await act(async () => {
      await auth.current.register({
          name: newUser.user_metadata.name,
          email: newUser.email,
          phone: newUser.user_metadata.phone || '',
          cedula: newUser.user_metadata.cedula || '',
          password: 'Secure#123',
          confirmPassword: 'Secure#123'
      });
    });

    await waitFor(() => expect(auth.current.pendingEmailConfirmation).toBe(true));

    act(() => {
      auth.current.clearPendingConfirmation();
    });

    expect(auth.current.pendingEmailConfirmation).toBe(false);
    expect(auth.current.pendingEmail).toBeNull();
  });

  describe('logout()', () => {
    it('clears storage and redirects after signing out', async () => {
      const auth = await renderAuthHook();

      const redirectMock = jest.fn();
      (globalThis as Record<string, unknown>).__AUTH_REDIRECT__ = redirectMock;

      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      await act(async () => {
        await auth.current.logout();
      });

      expect(signOut).toHaveBeenCalled();
      expect(removeItemSpy).toHaveBeenCalledWith('simaud-auth');
      expect(removeItemSpy.mock.calls.filter(call => call[0] === 'simaud-auth').length).toBeGreaterThanOrEqual(2);
      expect(redirectMock).toHaveBeenCalledWith('/auth');

      removeItemSpy.mockRestore();
    });

    it('warns and still clears state when Supabase signOut fails', async () => {
      const auth = await renderAuthHook();
      signOut.mockRejectedValue(new Error('network'));

      const redirectMock = jest.fn();
      (globalThis as Record<string, unknown>).__AUTH_REDIRECT__ = redirectMock;

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      await act(async () => {
        await auth.current.logout();
      });

      expect(warnSpy).toHaveBeenCalled();
      expect(removeItemSpy).toHaveBeenCalledWith('simaud-auth');
      expect(removeItemSpy.mock.calls.filter(call => call[0] === 'simaud-auth').length).toBeGreaterThanOrEqual(2);
      expect(redirectMock).toHaveBeenCalledWith('/auth');

      warnSpy.mockRestore();
      removeItemSpy.mockRestore();
    });
  });
});
