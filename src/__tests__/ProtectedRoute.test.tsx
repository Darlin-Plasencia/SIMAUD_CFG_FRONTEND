import '@testing-library/jest-dom/jest-globals'; // Activa los matchers de Testing Library para estas pruebas
import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

type ProtectedRouteComponent = (typeof import('../components/common/ProtectedRoute'))['ProtectedRoute'];
let ProtectedRoute: ProtectedRouteComponent;
let useAuthMock: jest.Mock;

beforeAll(async () => {
  useAuthMock = jest.fn();

  // Inyectamos un mock del contexto de autenticación para controlar los escenarios de acceso
  await jest.unstable_mockModule('../contexts/AuthContext', () => ({
    useAuth: useAuthMock
  }));

  // Sustituimos framer-motion por un contenedor neutro para evitar animaciones en el test
  await jest.unstable_mockModule('framer-motion', () => ({
    motion: {
      div: ({ children, ...props }: React.ComponentProps<'div'>) => (
        <div {...props}>{children}</div>
      )
    }
  }));

  ProtectedRoute = (await import('../components/common/ProtectedRoute')).ProtectedRoute;
});

// Estado base del usuario; cada caso ajusta solo los campos necesarios
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
    useAuthMock.mockReset(); // Cada prueba parte de un contexto limpio
  });

  it('shows a loading spinner when authentication state is loading', () => {
    useAuthMock.mockReturnValue({
      ...baseAuthValue,
      isLoading: true
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(container.querySelector('.border-2')).toBeInTheDocument(); // Debe mostrar el spinner de carga
  });

  it('returns null when the user is not authenticated', () => {
    useAuthMock.mockReturnValue({
      ...baseAuthValue
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(container).toBeEmptyDOMElement(); // Sin sesión, el componente no renderiza nada protegido
  });

  it('renders access denied message when role requirement is not met', () => {
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

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument(); // Usuarios sin rol válido reciben un aviso
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

    expect(screen.getByText('Admin content')).toBeInTheDocument(); // Con privilegios, se muestra el contenido hijo
  });
});
