import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import ProductCard from '../components/ProductCard';
import CourseCard from '../components/CourseCard';
import { Heart, Trash2, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!isSignedIn) return { data: { items: [] } };
      const token = await getToken();
      const res = await apiClient.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const removeMutation = useMutation({
    mutationFn: async (wishlistId: string) => {
      const token = await getToken();
      await apiClient.delete(`/wishlist/${wishlistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const wishlistItems: any[] = data?.data?.items || [];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-text-muted">Loading your saved wishlist items...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="p-6 bg-error-light border border-error/20 rounded-3xl text-error space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="font-bold text-base">Failed to load wishlist</p>
          <p className="text-xs">{(error as any)?.response?.data?.error?.message || 'An error occurred.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-text-muted/15 pb-4">
        <div className="p-2.5 bg-secondary-light text-secondary rounded-2xl">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-primary">Your Wishlist</h1>
          <p className="text-xs text-text-secondary">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'saved item' : 'saved items'} in your personal list
          </p>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-background-card rounded-3xl p-12 text-center border border-text-muted/15 space-y-5">
          <div className="w-16 h-16 bg-background-muted rounded-full flex items-center justify-center mx-auto text-text-muted">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-heading text-text-primary">Your Wishlist is Empty</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Save your favorite organic harvests, handcrafted goods, and masterclasses to revisit anytime.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-soft"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="relative group/wishlist flex flex-col justify-between">
              {item.product && <ProductCard product={item.product} />}
              {item.course && <CourseCard course={item.course} />}

              {/* Quick Remove Overlay Action */}
              <button
                onClick={() => removeMutation.mutate(item.id)}
                disabled={removeMutation.isPending}
                className="mt-2 w-full py-1.5 bg-background-card hover:bg-error-light hover:text-error border border-text-muted/20 rounded-xl text-xs font-semibold text-text-secondary transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Wishlist</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
