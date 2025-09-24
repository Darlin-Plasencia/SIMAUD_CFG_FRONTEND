import pathlib

header = """import '@testing-library/jest-dom/jest-globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { LoginCredentials, RegisterData } from '../types';

type AuthModule = typeof import('../contexts/AuthContext');
let AuthProvider: AuthModule['AuthProvider'];
let useAuth: AuthModule['useAuth'];

type TestAuthError = { message: string };
interface TestAuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  user_metadata: Record<string, unknown>;
}

interface TestSession {
  user: TestAuthUser | null;
}

type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';
type AuthStateCallback = (event: AuthChangeEvent, session: TestSession | null) => void | Promise<void>;

type AuthResult<T> = { data: T; error: TestAuthError | null };
type OperationResult = { error: TestAuthError | null };

type AsyncFnMock<TArgs extends unknown[], TResult> = jest.Mock<Promise<TResult>, TArgs>;
type SyncFnMock<TArgs extends unknown[], TResult> = jest.Mock<TResult, TArgs>;

interface QueryBuilder {
  select: SyncFnMock<[string?], QueryBuilder>;
  eq: SyncFnMock<[string, unknown], QueryBuilder>;
  single: AsyncFnMock<[], { data: unknown }>;
}

const signInWithPassword: AsyncFnMock<[LoginCredentials], AuthResult<{ user: TestAuthUser | null }>> = jest.fn();
const signOut: AsyncFnMock<[{ scope?: 'global' }?], OperationResult> = jest.fn();
const signUp: AsyncFnMock<[
  {
    email: string;
    password: string;
    options?: {
      data?: Record<string, unknown>;
      emailRedirectTo?: string | null;
    };
  }
], AuthResult<{ user: TestAuthUser | null }>> = jest.fn();
const resend: AsyncFnMock<[
  {
    type: 'signup';
    email: string;
    options?: {
      emailRedirectTo?: string | null;
    };
  }
], OperationResult> = jest.fn();
const getSession: AsyncFnMock<[], AuthResult<{ session: TestSession | null }>> = jest.fn();
const onAuthStateChange: AsyncFnMock<[AuthStateCallback], { data: { subscription: { unsubscribe: jest.Mock<void, []> } }; error: TestAuthError | null }> = jest.fn();
const getUser: AsyncFnMock<[], AuthResult<{ user: TestAuthUser | null }>> = jest.fn();
const fromMock: SyncFnMock<[string], QueryBuilder> = jest.fn();

let queryBuilder: QueryBuilder;
let authStateCallback: AuthStateCallback | undefined;

const buildQueryBuilder = (): QueryBuilder => {
  const builder: QueryBuilder = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.single.mockResolvedValue({ data: null });
  return builder;
};

const createAuthError = (message: string): TestAuthError => ({ message });
const authSuccess = <T>(data: T): AuthResult<T> => ({ data, error: null });
const operationSuccess = (): OperationResult => ({ error: null });

const buildAuthUser = (overrides: Partial<TestAuthUser> = {}): TestAuthUser => {
  const metadataOverride = overrides.user_metadata ?? {};
  return {
    id: 'user-1',
    email: 'user@example.com',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    user_metadata: { name: 'User', role: 'user', ...metadataOverride },
    ...overrides,
    user_metadata: { name: 'User', role: 'user', ...metadataOverride },
  };
};

"""

path = pathlib.Path('src/__tests__/AuthContext.test.tsx')
text = path.read_text()
marker = "describe('AuthContext'"
if marker not in text:
    raise SystemExit('marker not found')
path.write_text(header + text[text.index(marker):])
