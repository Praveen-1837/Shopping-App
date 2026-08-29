import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import {
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  Archive,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const CATEGORIES = ['All Categories', 'Food & Spices', 'Artisan Crafts', 'Eco Living', 'Organic Produce'];

export default function AdminProducts() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch admin products
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminProducts', page, search, selectedCategory, statusFilter],
    queryFn: async () => {
      const token = await getToken();
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (selectedCategory !== 'All Categories') params.category = selectedCategory;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await apiClient.get('/admin/products', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const productsData = data?.data;
  const products = productsData?.items || [];
  const totalPages = productsData?.totalPages || 1;
  const total = productsData?.total || 0;

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      const token = await getToken();
      await apiClient.patch(
        `/admin/products/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      await apiClient.delete(`/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });

  const errorMessage =
    (error as any)?.response?.data?.error?.message ||
    (error as any)?.message ||
    'Failed to load admin products catalog';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/15 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary-light text-primary rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-text-primary">Platform Products Catalog</h1>
            <p className="text-xs text-text-secondary">
              Manage platform-wide product listings, archive/activate status, or permanently delete items.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3.5 py-2 bg-background-card border border-text-muted/20 rounded-xl text-text-secondary shrink-0">
          Total Products: <strong className="text-primary">{total}</strong>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background-card p-4 rounded-2xl border border-text-muted/15 shadow-soft">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses (Active & Archived)</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Archived / Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="py-20 text-center text-text-secondary space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium">Loading products catalog...</p>
        </div>
      ) : isError ? (
        <div className="bg-error-light border border-error/30 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-error" />
          <p className="text-sm font-bold text-error">Failed to load admin products</p>
          <p className="text-xs text-error/80 font-mono max-w-md mx-auto">{errorMessage}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-error text-white text-xs font-semibold rounded-lg hover:bg-error/90 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-background-card rounded-2xl p-12 text-center border border-text-muted/15 space-y-3">
          <Package className="w-12 h-12 mx-auto text-text-muted opacity-50" />
          <h3 className="text-lg font-bold font-heading">No Products Found</h3>
          <p className="text-xs text-text-secondary">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="bg-background-card rounded-2xl border border-text-muted/15 overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background-muted/60 text-text-secondary border-b border-text-muted/15 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Seller</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-muted/10 font-medium">
                {products.map((product: any) => {
                  const isActive = product.status === 'ACTIVE';
                  const mainImg = product.images?.[0] || 'https://via.placeholder.com/100';

                  return (
                    <tr key={product.id} className="hover:bg-background-muted/30 transition-colors">
                      <td className="py-3 px-4 flex items-center space-x-3 max-w-xs">
                        <img
                          src={mainImg}
                          alt={product.title}
                          className="w-10 h-10 object-cover rounded-xl border border-text-muted/20 shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-bold text-text-primary truncate">{product.title}</p>
                          <p className="text-[10px] text-text-muted font-mono truncate">{product.id}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-background-muted rounded-lg text-text-secondary font-semibold">
                          {product.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-text-primary">{product.seller?.name || 'Seller'}</p>
                        <p className="text-[11px] text-text-muted">{product.seller?.email}</p>
                      </td>

                      <td className="py-3 px-4 font-bold text-text-primary">₹{Number(product.price).toFixed(2)}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            product.stock === 0 ? 'text-error' : product.stock <= 5 ? 'text-warning' : 'text-text-primary'
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-success-light text-success border border-success/30'
                              : 'bg-text-muted/10 text-text-muted border border-text-muted/20'
                          }`}
                        >
                          {isActive ? <CheckCircle className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                          <span>{isActive ? 'ACTIVE' : 'ARCHIVED'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Toggle Archive/Activate */}
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: product.id,
                                status: isActive ? 'INACTIVE' : 'ACTIVE',
                              })
                            }
                            disabled={toggleStatusMutation.isPending}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                              isActive
                                ? 'bg-warning-light text-warning hover:bg-warning hover:text-white'
                                : 'bg-success-light text-success hover:bg-success hover:text-white'
                            }`}
                            title={isActive ? 'Archive (Hide from Storefront)' : 'Activate (Show on Storefront)'}
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>{isActive ? 'Archive' : 'Activate'}</span>
                          </button>

                          {/* Delete Product */}
                          <button
                            onClick={() => setDeletingId(product.id)}
                            className="p-1.5 text-error hover:bg-error-light rounded-lg transition-colors cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-text-muted/15 flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                Page <strong className="text-text-primary">{page}</strong> of{' '}
                <strong className="text-text-primary">{totalPages}</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-text-muted/20 hover:bg-background-muted text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 inline" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-text-muted/20 hover:bg-background-muted text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-background-card rounded-2xl p-6 max-w-sm w-full space-y-4 border border-text-muted/20 shadow-card">
            <div className="flex items-center space-x-3 text-error">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-heading font-bold text-base text-text-primary">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-background-muted text-text-primary text-xs font-semibold rounded-xl hover:bg-background-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-error text-white text-xs font-semibold rounded-xl hover:bg-error/90 transition-colors flex items-center space-x-1"
              >
                {deleteMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
