import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { role } = useUserRole();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Verifying authentication...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === 'ADMIN') {
    const isCustomerRoute =
      location.pathname === '/my-account' ||
      location.pathname === '/cart' ||
      location.pathname.startsWith('/checkout') ||
      location.pathname.startsWith('/my-world');
    if (isCustomerRoute) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(role);

    if (!hasRole) {
      // Redirect unauthorized users to partner application page with informative message
      return (
        <Navigate
          to="/apply"
          state={{
            message: `You need a ${allowedRoles.join('/')} account to view that dashboard page. Apply below!`,
          }}
          replace
        />
      );
    }
  }

  return <>{children}</>;
}
