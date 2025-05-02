import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const LoadingComponent = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      <p className="ml-3 text-gaming-light">{t('common.loading', '로딩 중...')}</p>
    </div>
  );
};

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Rendering - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  if (isLoading) {
    console.log('[ProtectedRoute] Showing LoadingComponent');
    return <LoadingComponent />;
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('[ProtectedRoute] Rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;