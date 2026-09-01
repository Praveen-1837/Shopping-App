import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import {
  Store,
  Search,
  RefreshCw,
  AlertCircle,
  Package,
  ShoppingBag,
  Calendar,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sprout,
  Award,
  Briefcase,
} from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  storeName: string;
  logoUrl?: string | null;
  bio?: string | null;
  badges: string[];
  location?: string | null;
  producerId?: string | null;
  productCount: number;
  orderCount: number;
}

interface StoresResponse {
  success: boolean;
  data: {
    items: StoreItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminStores() {
  const { getToken, isSignedIn } = useAuth();
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  const { data, isLoading, isError, error, refetch } = useQuery<StoresResponse>({
    queryKey: ['admin-stores', page, search],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<StoresResponse>('/admin/stores', {
        params: { page, limit: 15, search },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const stores = data?.data?.items || [];
  const pagination = data?.data;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'FARMER':
        return {
          label: 'Farmer',
          className: 'bg-secondary-light text-secondary border-secondary/30',
          icon: Sprout,
        };
      case 'ARTISAN':
        return {
          label: 'Artisan',
          className: 'bg-accent/20 text-text-primary border-accent/40',
          icon: Award,
        };
      default:
        return {
          label: 'Seller',
          className: 'bg-primary-light text-primary border-primary/30',
          icon: Briefcase,
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-text-muted/15 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20 mb-2">
            <Store className="w-4 h-4" />
            <span>Storefront Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-primary">
            Active Marketplace Stores
          </h1>
          <p className="text-xs text-text-secondary">
            Manage and view all approved Seller, Farmer, and Artisan stores operating on the platform.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by store name or seller..."
              className="w-full pl-9 pr-4 py-2 bg-background-card border border-text-muted/20 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-soft"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading store directory...</p>
        </div>
      ) : isError ? (
        <div className="bg-error-light border border-error/30 rounded-2xl p-6 text-error flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">
              {(error as any)?.response?.data?.error?.message || 'Failed to load active stores'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-error text-white text-xs font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-background-card rounded-2xl p-12 text-center border border-text-muted/15 space-y-4">
          <Store className="w-12 h-12 mx-auto text-text-muted opacity-40" />
          <h3 className="text-xl font-bold font-heading">No Active Stores Found</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            {search ? `No seller store matching "${search}" was found.` : 'No approved sellers are currently active.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Table Container */}
          <div className="bg-background-card rounded-2xl border border-text-muted/15 overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-background-muted/60 text-text-muted uppercase text-[10px] tracking-wider border-b border-text-muted/15">
                    <th className="py-3.5 px-5 font-bold">Store / Seller Details</th>
                    <th className="py-3.5 px-4 font-bold">Type</th>
                    <th className="py-3.5 px-4 font-bold text-center">Products</th>
                    <th className="py-3.5 px-4 font-bold text-center">Orders</th>
                    <th className="py-3.5 px-4 font-bold">Date Approved</th>
                    <th className="py-3.5 px-5 font-bold text-right">Storefront Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-text-muted/10">
                  {stores.map((store) => {
                    const badge = getRoleBadge(store.role);
                    const RoleIcon = badge.icon;
                    const joinedDate = new Date(store.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr key={store.id} className="hover:bg-background-muted/30 transition-colors">
                        {/* Store Info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-3">
                            {store.logoUrl ? (
                              <img
                                src={store.logoUrl}
                                alt={store.storeName}
                                className="w-10 h-10 rounded-xl object-cover border border-text-muted/20"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center font-heading font-extrabold text-sm border border-primary/20">
                                {store.storeName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="space-y-0.5 max-w-xs">
                              <span className="font-heading font-bold text-sm text-text-primary block truncate">
                                {store.storeName}
                              </span>
                              <span className="text-text-secondary text-[11px] block truncate">
                                {store.name} • {store.email}
                              </span>
                              {store.location && (
                                <span className="text-[10px] text-text-muted flex items-center space-x-1">
                                  <MapPin className="w-3 h-3 text-secondary" />
                                  <span>{store.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role Type */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.className}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Product Count */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center space-x-1 font-bold text-text-primary">
                            <Package className="w-3.5 h-3.5 text-primary" />
                            <span>{store.productCount}</span>
                          </div>
                        </td>

                        {/* Order Count */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center space-x-1 font-bold text-text-primary">
                            <ShoppingBag className="w-3.5 h-3.5 text-secondary" />
                            <span>{store.orderCount}</span>
                          </div>
                        </td>

                        {/* Date Approved */}
                        <td className="py-4 px-4 text-text-secondary text-[11px]">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-text-muted" />
                            <span>{joinedDate}</span>
                          </div>
                        </td>

                        {/* Actions / View Storefront */}
                        <td className="py-4 px-5 text-right">
                          {store.producerId ? (
                            <Link
                              to={`/producer/${store.producerId}`}
                              target="_blank"
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-background-muted hover:bg-primary-light text-primary hover:text-primary text-xs font-semibold rounded-lg transition-colors border border-text-muted/15"
                            >
                              <span>View Storefront</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <Link
                              to={`/?producerRole=${store.role}`}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-background-muted hover:bg-primary-light text-text-secondary hover:text-primary text-xs font-semibold rounded-lg transition-colors border border-text-muted/15"
                            >
                              <span>View Products ({store.productCount})</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary">
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total stores)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded-xl disabled:opacity-40 hover:bg-background-card transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-2 border rounded-xl disabled:opacity-40 hover:bg-background-card transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
