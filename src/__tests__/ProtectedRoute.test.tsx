import '@testing-library/jest-dom/jest-globals';
import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type ProtectedRouteModule = typeof import('../components/common/ProtectedRoute');
let protectedRouteModule: ProtectedRouteModule;
let ProtectedRoute: ProtectedRouteModule['ProtectedRoute'];
let useAuthMock: jest.Mock;

beforeAll(async () => {
  useAuthMock = jest.fn();

  await jest.unstable_mockModule('../contexts/AuthContext', () => ({
    useAuth: useAuthMock
  }));

  await jest.unstable_mockModule('framer-motion', () => ({
    motion: {
      div: ({ children, ...props }: React.ComponentProps<'div'>) => (
        <div {...props}>{children}</div>
      )
    }
  }));

  protectedRouteModule = await import('../components/common/ProtectedRoute');
  ProtectedRoute = protectedRouteModule.ProtectedRoute;
});

const baseAuthValue = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isUpdatingRole: false,
  pendingEmailConfirmation: false,
  pendingEmail: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  resendConfirmation: jest.fn(),
  clearPendingConfirmation: jest.fn(),
  refreshUserProfile: jest.fn()
};

describe('ProtectedRoute', () => {
  afterEach(() => {
    useAuthMock.mockReset();
    delete (globalThis as Record<string, unknown>).__FORCE_RELOAD__;
  });

  it('shows a loading spinner while authentication is resolving', () => {
    useAuthMock.mockReturnValue({
      ...baseAuthValue,
      isLoading: true
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(container.querySelector('.border-2')).toBeInTheDocument();
  });

  it('renders nothing when the user is not authenticated', () => {
    useAuthMock.mockReturnValue({
      ...baseAuthValue
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows an access denied message when the role does not match', () => {
    useAuthMock.mockReturnValue({
      ...baseAuthValue,
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        phone: '',
        cedula: '',
        role: 'user',
        createdAt: '',
        avatarUrl: null
      }
    });

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
  });

  it('offers a reload action when the user lacks permissions', async () => {
    useAuthMock.mockReturnValue({
      ...baseAuthValue,
      isAuthenticated: true,
      user: {
        id: '3',
        email: 'user@example.com',
        name: 'User',
        phone: '',
        cedula: '',
        role: 'user',
        createdAt: '',
        avatarUrl: null
      }
    });

    const reloadMock = jest.fn();
    (globalThis as Record<string, unknown>).__FORCE_RELOAD__ = reloadMock;

    const user = userEvent.setup();

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Protected content</div>
      </ProtectedRoute>
    );

    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(reloadMock).toHaveBeenCalled();
  });

  it('renders children when the user has the required role', () => {
    useAuthMock.mockReturnValue({
      ...baseAuthValue,
      isAuthenticated: true,
      user: {
        id: '2',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '',
        cedula: '',
        role: 'admin',
        createdAt: '',
        avatarUrl: null
      }
    });

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
