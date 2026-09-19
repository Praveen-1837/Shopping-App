import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import SmartCartItem from '../components/SmartCartItem';
import { ShoppingBag, ArrowRight, Trash2, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user cart
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      if (!isSignedIn) return { data: { items: [] } };
      const token = await getToken();
      const res = await apiClient.get('/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Update item quantity mutation with Optimistic UI updates
  const updateQtyMutation = useMutation({
    mutationFn: async ({ productId, courseId, quantity }: { productId?: string; courseId?: string; quantity: number }) => {
      const token = await getToken();
      const targetId = productId || courseId;
      await apiClient.put(
        `/cart/items/${targetId}`,
        { productId, courseId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onMutate: async ({ productId, courseId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      const targetId = productId || courseId;

      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old?.data?.items) return old;
        const updatedItems = old.data.items.map((item: any) => {
          const itemId = item.productId || item.courseId;
          if (itemId === targetId) {
            return { ...item, quantity };
          }
          return item;
        });
        return {
          ...old,
          data: {
            ...old.data,
            items: updatedItems,
          },
        };
      });

      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Remove item mutation with Optimistic UI updates
  const removeItemMutation = useMutation({
    mutationFn: async ({ productId, courseId }: { productId?: string; courseId?: string }) => {
      const token = await getToken();
      const targetId = productId || courseId;
      await apiClient.delete(`/cart/items/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId, courseId },
      });
    },
    onMutate: async ({ productId, courseId }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      const targetId = productId || courseId;

      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old?.data?.items) return old;
        const filteredItems = old.data.items.filter((item: any) => {
          const itemId = item.productId || item.courseId;
          return itemId !== targetId;
        });
        return {
          ...old,
          data: {
            ...old.data,
            items: filteredItems,
          },
        };
      });

      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Clear cart mutation with Optimistic UI updates
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await apiClient.delete('/cart/clear', {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);

      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: [],
          },
        };
      });

      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const cartItems: any[] = data?.data?.items || [];
  const totalItemCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce((acc, item) => acc + Number(item.price) * (item.quantity || 1), 0);
  const deliveryFee = subtotal > 0 && subtotal < 1000 ? 50 : 0;
  const grandTotal = subtotal + deliveryFee;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-base font-medium text-text-muted">Loading your sustainable cart...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="p-6 bg-error-light border border-error/20 rounded-3xl text-error space-y-2">
          <p className="font-bold text-base">Failed to load shopping cart</p>
          <p className="text-sm">{(error as any)?.response?.data?.error?.message || 'Please check your connection and try again.'}</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn || cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-background-muted rounded-full flex items-center justify-center text-text-muted">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-heading text-text-primary">Your Shopping Cart is Empty</h2>
          <p className="text-sm text-text-muted max-w-sm mx-auto">
            Discover verified organic harvests, eco-friendly goods, and sustainable masterclasses!
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-colors shadow-soft cursor-pointer"
        >
          Explore Sustainable Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Page Title & Free Shipping Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/15 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-primary">Shopping Cart</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Deselect items or adjust quantities before proceeding to checkout.
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to clear your entire cart?')) {
              clearCartMutation.mutate();
            }
          }}
          disabled={clearCartMutation.isPending}
          className="text-sm font-semibold text-text-muted hover:text-error transition-colors flex items-center space-x-1 cursor-pointer w-fit"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Items</span>
        </button>
      </div>

      {/* Free Shipping Banner */}
      {subtotal >= 1000 ? (
        <div className="bg-success-light/80 border border-success/30 rounded-2xl p-3.5 flex items-center space-x-2 text-sm text-success font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Your order qualifies for FREE Eco-Standard Delivery!</span>
        </div>
      ) : (
        <div className="bg-secondary-light/60 border border-secondary/30 rounded-2xl p-3.5 text-sm text-text-primary font-medium">
          Add <strong className="text-primary font-bold">₹{(1000 - subtotal).toFixed(2)}</strong> more of eligible items to qualify for FREE Delivery.
        </div>
      )}

      {/* 2-Column Amazon Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Cart Line Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-background-card rounded-3xl p-5 border border-text-muted/15 shadow-soft space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary border-b border-text-muted/10 pb-2">
              Cart Items ({totalItemCount})
            </h3>
            <div className="space-y-4 divide-y divide-text-muted/10">
              {cartItems.map((item, idx) => (
                <div key={item.productId || item.courseId || idx} className={idx > 0 ? 'pt-4' : ''}>
                  <SmartCartItem
                    item={item}
                    onUpdateQuantity={(productId, courseId, newQty) => {
                      if (newQty) {
                        updateQtyMutation.mutate({ productId, courseId, quantity: newQty });
                      }
                    }}
                    onRemove={(productId, courseId) => {
                      removeItemMutation.mutate({ productId, courseId });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Sticky Order Summary Card */}
        <aside className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-5 sticky top-24">
          <h3 className="font-heading font-bold text-base text-text-primary border-b border-text-muted/10 pb-3">
            Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Items Subtotal</span>
              <span className="font-bold text-text-primary">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-text-secondary">
              <span>Estimated Delivery</span>
              <span>
                {deliveryFee === 0 ? <strong className="text-success font-bold">FREE</strong> : `₹${deliveryFee.toFixed(2)}`}
              </span>
            </div>

            <div className="pt-3 border-t border-text-muted/15 flex justify-between text-lg font-extrabold font-heading text-primary">
              <span>Order Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 bg-secondary text-white font-extrabold text-sm rounded-xl hover:bg-secondary-dark transition-colors shadow-card flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 text-[11px] text-text-muted justify-center pt-1">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Secure 256-bit Encrypted Checkout</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
