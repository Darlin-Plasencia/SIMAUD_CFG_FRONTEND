import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

type ReloadOverride = { __FORCE_RELOAD__?: () => void };

export const reloadPage = (): void => {
  const override = (globalThis as ReloadOverride).__FORCE_RELOAD__;
  if (override) {
    override();
    return;
  }

  window.location.reload();
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, user, isLoading, isUpdatingRole } = useAuth();

  if (isLoading || isUpdatingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta secci\u00f3n.
          </p>
          <button
            onClick={reloadPage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
