# Validación de componentes con pruebas automatizadas (Jest)

## Objetivo
- Verificar, mediante suites automatizadas, el comportamiento de componentes clave del FrontEnd y la inicialización del cliente Supabase.
- Documentar la configuración de Jest y los pasos necesarios para reproducir la evidencia obtenida.

## Entorno de pruebas
- Node.js 20 (según flujo CI `.github/workflows/ci.yml`).
- Vite + React 18 con TypeScript en modo ESM.
- Jest configurado con `ts-jest` y entorno `jsdom` (`jest.config.ts`).
- Setup global: registro de matchers de Testing Library y valores por defecto para variables `VITE_SUPABASE_*` (`jest.setup.ts`).

## Scripts disponibles
- `npm test`: ejecuta Jest en modo ESM con la configuración descrita.
- `npm ci`: utilizado en CI para instalar dependencias antes de lanzar las pruebas.

## Casos evaluados
- **Frontend** – `LoadingSpinner` (renderizado por defecto y props custom).
- **Frontend** – `ProtectedRoute` (escenarios de autenticación, roles y renderizado condicional).
- **Integración Supabase** – `supabase client` (validación de variables de entorno y parámetros enviados a `createClient`).

## Fragmentos de código relevantes

### LoadingSpinner.test.tsx
```tsx
import '@testing-library/jest-dom/jest-globals'; // Habilita los matchers extra de Testing Library en Jest
import { ComponentProps } from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Reemplazamos el componente animado por un div estático para aislar la lógica de la prueba
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: ComponentProps<'div'>) => (
      <div {...props}>{children}</div>
    )
  }
}));

describe('LoadingSpinner', () => {
  it('renders medium size spinner by default', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.border-2') as HTMLElement;

    expect(spinner).toHaveClass('w-8 h-8'); // El tamaño por defecto debe ser mediano
  });

  it('applies custom size and className', () => {
    const { container } = render(<LoadingSpinner size="large" className="custom-class" />);
    const wrapper = container.firstElementChild as HTMLElement;
    const spinner = container.querySelector('.border-2') as HTMLElement;

    expect(wrapper).toHaveClass('custom-class'); // Respeta la clase adicional recibida por props
    expect(spinner).toHaveClass('w-12 h-12'); // El tamaño grande ajusta las dimensiones del spinner
  });
});
```

### ProtectedRoute.test.tsx
```tsx
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
```

### supabase.test.ts
```ts
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

    expect(module.supabase).toBeDefined(); // El módulo debe exponer el cliente instanciado
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
```

## Pasos de ejecución
1. Instalar dependencias del proyecto (`npm install` o `npm ci`).
2. Ejecutar `npm test` para lanzar las suites descritas.
3. Revisar la salida de la consola y, en caso de ejecutarse en CI, validar el job `Run tests` en GitHub Actions.

## Evidencias de la última ejecución
```
Test Suites: 3 passed, 3 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        3.316 s, estimated 8 s
Ran all test suites.
```

## Conclusión
Las tres suites cubren el renderizado y la lógica de acceso de los componentes críticos del FrontEnd, junto con la configuración del cliente Supabase. La ejecución concluye sin fallos, lo que demuestra que la validación automatizada con Jest está operativa y protege los escenarios funcionales descritos.
