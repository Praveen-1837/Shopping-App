import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { ProductsResponse, Product } from '../types/product';
import { Plus, Edit3, Trash2, Package, RefreshCw, AlertCircle, Eye, ExternalLink } from 'lucide-react';

export default function MyProducts() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Fetch current user's profile to get sellerId
  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get('/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const sellerDbId = userData?.data?.id;

  // Fetch products created by this seller
  const { data, isLoading, isError, error, refetch } = useQuery<ProductsResponse>({
    queryKey: ['my-products', sellerDbId],
    queryFn: async () => {
      const res = await apiClient.get<ProductsResponse>('/products', {
        params: { sellerId: sellerDbId, limit: 50 },
      });
      return res.data;
    },
    enabled: !!sellerDbId,
  });

  const products = data?.data || [];

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const token = await getToken();
      await apiClient.delete(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      setDeleteTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/15 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Seller Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-primary">My Products Inventory</h1>
          <p className="text-sm text-text-secondary">
            Manage your active listings, pricing, stock levels, and product details
          </p>
        </div>

        <Link
          to="/seller/products/new"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-soft cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Product List Table / Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-text-secondary space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium">Fetching your product catalog...</p>
        </div>
      ) : isError ? (
        <div className="bg-error-light border border-error/30 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-error" />
          <h3 className="text-lg font-bold text-error font-heading">Failed to Load Seller Products</h3>
          <p className="text-xs text-error/90 max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message || (error as any)?.message}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-error text-white text-xs font-semibold rounded-lg hover:bg-error/90"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-background-card rounded-2xl p-12 text-center border border-text-muted/15 space-y-4">
          <Package className="w-12 h-12 mx-auto text-text-muted opacity-50" />
          <h3 className="text-xl font-bold font-heading">No Products Listed Yet</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            You haven't added any products to your seller catalog. Click below to create your first listing!
          </p>
          <Link
            to="/seller/products/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-soft"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Product</span>
          </Link>
        </div>
      ) : (
        <div className="bg-background-card rounded-2xl border border-text-muted/15 overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-muted/70 text-text-secondary text-xs uppercase font-semibold border-b border-text-muted/15">
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Producer Link</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-muted/10 text-sm">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-background-muted/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <img
                          src={prod.images?.[0] || 'https://via.placeholder.com/80'}
                          alt={prod.title}
                          className="w-12 h-12 rounded-xl object-cover border border-text-muted/15"
                        />
                        <div>
                          <p className="font-bold text-text-primary line-clamp-1">{prod.title}</p>
                          <span className="text-[11px] text-text-muted">ID: {prod.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs font-medium text-text-secondary">
                      <span className="bg-background-muted px-2.5 py-1 rounded-full border border-text-muted/15">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-bold font-heading text-primary">
                      ₹{Number(prod.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          prod.stock > 0
                            ? 'bg-success-light text-success'
                            : 'bg-error-light text-error'
                        }`}
                      >
                        {prod.stock > 0 ? `${prod.stock} units` : 'Out of stock'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-text-secondary">
                      {prod.producer ? (
                        <span className="text-primary font-medium">{prod.producer.name}</span>
                      ) : (
                        <span className="text-text-muted italic">Unlinked</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/product/${prod.id}`}
                          title="View product detail"
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light/50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <Link
                          to={`/seller/products/edit/${prod.id}`}
                          title="Edit product"
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light/50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>

                        {deleteTargetId === prod.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => deleteMutation.mutate(prod.id)}
                              disabled={deleteMutation.isPending}
                              className="px-2.5 py-1 bg-error text-white text-xs font-bold rounded-lg"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(null)}
                              className="px-2 py-1 bg-background-muted text-xs rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteTargetId(prod.id)}
                            title="Delete product"
                            className="p-2 text-text-secondary hover:text-error hover:bg-error-light/50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
