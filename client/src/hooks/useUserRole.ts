import { useUser, useAuth } from '@clerk/clerk-react';

export interface UserRoleState {
  role: string;
  isSignedIn: boolean;
  isCustomer: boolean;
  isSeller: boolean;
  isFarmer: boolean;
  isArtisan: boolean;
  isEducator: boolean;
  isAdmin: boolean;
  isDeliveryPartner: boolean;
  canAccessSellerCentre: boolean;
  canAccessFarmerCentre: boolean;
  canAccessEducatorCentre: boolean;
  hasAnyPartnerRole: boolean;
}

export function useUserRole(): UserRoleState {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  
  const role = (isSignedIn && (user?.publicMetadata?.role as string)) || 'CUSTOMER';

  const isSeller = role === 'SELLER';
  const isFarmer = role === 'FARMER';
  const isArtisan = role === 'ARTISAN';
  const isEducator = role === 'EDUCATOR';
  const isAdmin = role === 'ADMIN';
  const isDeliveryPartner = role === 'DELIVERY_PARTNER';

  const canAccessSellerCentre = !!isSignedIn && ['SELLER', 'FARMER', 'ARTISAN', 'ADMIN'].includes(role);
  const canAccessFarmerCentre = !!isSignedIn && ['FARMER', 'SELLER', 'ARTISAN', 'ADMIN'].includes(role);
  const canAccessEducatorCentre = !!isSignedIn && ['EDUCATOR', 'ADMIN'].includes(role);

  const hasAnyPartnerRole = !!isSignedIn && (isSeller || isFarmer || isArtisan || isEducator || isDeliveryPartner || isAdmin);
  const isCustomer = !isSignedIn || role === 'CUSTOMER' || !hasAnyPartnerRole;

  return {
    role,
    isSignedIn: !!isSignedIn,
    isCustomer,
    isSeller,
    isFarmer,
    isArtisan,
    isEducator,
    isAdmin,
    isDeliveryPartner,
    canAccessSellerCentre,
    canAccessFarmerCentre,
    canAccessEducatorCentre,
    hasAnyPartnerRole,
  };
}
