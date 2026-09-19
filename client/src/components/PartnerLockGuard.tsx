import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { RefreshCw } from 'lucide-react';
import apiClient from '../api/axios';

export default function PartnerLockGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isLoaded && isSignedIn && user) {
      setIsVerifying(true);
      
      const fetchRole = async () => {
        try {
          const token = await getToken();
          const res = await apiClient.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.data?.success && isMounted) {
            const actualRole = res.data.data.role;
            setDbRole(actualRole);
            
            // Sync Clerk session token if stale
            if (user.publicMetadata?.role !== actualRole) {
              await user.reload();
            }
          }
        } catch (error) {
          console.error('Failed to sync role with DB', error);
        } finally {
          if (isMounted) setIsVerifying(false);
        }
      };
      
      fetchRole();
    } else if (isLoaded && !isSignedIn) {
      setDbRole('CUSTOMER'); // Default if not signed in
    }
    
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user, getToken, location.pathname]);

  if (!isLoaded || isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3 bg-background-main text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-base font-medium">Loading EcoMarket...</p>
      </div>
    );
  }

  // Determine active role from DB (source of truth)
  const activeRole = dbRole || (user?.publicMetadata?.role as string) || 'CUSTOMER';
  
  // Partner Lock Logic
  const isPartner = ['SELLER', 'FARMER', 'ARTISAN', 'EDUCATOR', 'DELIVERY_PARTNER', 'ADMIN'].includes(activeRole);
  
  if (isPartner) {
    const path = location.pathname;
    
    // Check if they are trying to access a route outside their allowlist
    let isAllowed = false;
    let targetDashboard = '/';

    if (activeRole === 'ADMIN') {
      isAllowed = path.startsWith('/admin') || path.startsWith('/api'); // allow api proxy just in case
      targetDashboard = '/admin/dashboard';
    } else if (activeRole === 'SELLER') {
      isAllowed = path.startsWith('/seller');
      targetDashboard = '/seller-centre';
    } else if (activeRole === 'FARMER') {
      isAllowed = path.startsWith('/farmer');
      targetDashboard = '/farmer-centre';
    } else if (activeRole === 'ARTISAN') {
      // Assuming Artisan uses Seller centre or Farmer centre? The codebase maps ARTISAN to SELLER usually, let's check App.tsx
      isAllowed = path.startsWith('/seller');
      targetDashboard = '/seller-centre';
    } else if (activeRole === 'EDUCATOR') {
      isAllowed = path.startsWith('/educator');
      targetDashboard = '/educator-centre';
    } else if (activeRole === 'DELIVERY_PARTNER') {
      isAllowed = path.startsWith('/delivery');
      targetDashboard = '/delivery-centre';
    }

    if (!isAllowed) {
      return <Navigate to={targetDashboard} replace />;
    }
  }

  return <>{children}</>;
}
