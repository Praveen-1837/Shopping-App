import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Product } from '../types/product';
import ProducerBadge from '../components/ProducerBadge';
import TraceabilityTimeline from '../components/TraceabilityTimeline';
import { Leaf, ArrowLeft, Trash2, Edit3, AlertCircle, RefreshCw, ShoppingCart, Check } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();

  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  const [added, setAdded] = useState<boolean>(false);

  // Fetch product detail query
  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Product }>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Product }>(`/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const product = data?.data;

  // Check if logged in user is owner or admin
  const userRole = (clerkUser?.publicMetadata?.role as string) || 'CUSTOMER';
  const isOwner =
    (clerkUser && product?.seller?.clerkId === clerkUser.id) || userRole === 'ADMIN';

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        navigate('/login');
        return;
      }
      const token = await getToken();
      await apiClient.post(
        '/cart/items',
        { productId: product?.id, quantity: 1, itemType: 'PRODUCT' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setAdded(true);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setAdded(false), 2500);
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await apiClient.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      navigate('/shop');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-error-light border border-error/30 rounded-2xl p-8 space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-error" />
          <h2 className="text-2xl font-bold text-error font-heading">Product Not Found</h2>
          <p className="text-xs text-error/90 max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message || 'The requested product does not exist.'}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  ];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Back Button & Owner Controls */}
      <div className="flex items-center justify-between">
        <Link
          to="/shop"
          className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>

        {isOwner && (
          <div className="flex items-center space-x-3">
            <Link
              to={`/seller/products/edit/${product.id}`}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-background-card border border-text-muted/20 hover:bg-background-muted text-xs font-semibold text-text-primary rounded-xl transition-colors"
            >
              <Edit3 className="w-4 h-4 text-primary" />
              <span>Edit Product</span>
            </Link>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-error-light border border-error/30 hover:bg-error text-error hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 bg-error-light p-1.5 rounded-xl border border-error/30">
                <span className="text-xs text-error font-bold px-2">Confirm Delete?</span>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1 bg-error text-white text-xs font-bold rounded-lg hover:bg-error/90"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2 py-1 bg-background-card text-text-primary text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-background-card rounded-2xl p-6 md:p-10 border border-text-muted/15 shadow-soft">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-background-muted border border-text-muted/10 shadow-card">
            <img
              src={images[activeImageIdx]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-background-card/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-primary border border-text-muted/10">
              {product.category}
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIdx === idx
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-text-muted/20 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Linked Producer Badge */}
            {product.producer && (
              <ProducerBadge producer={product.producer} />
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold font-heading text-primary leading-tight">
              {product.title}
            </h1>

            {/* Price & Stock status */}
            <div className="flex items-center justify-between py-3 border-y border-text-muted/10">
              <div>
                <span className="text-xs text-text-muted block">Market Price</span>
                <span className="text-3xl font-bold font-heading text-primary">
                  ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                  product.stock > 0
                    ? 'bg-success-light text-success border border-success/30'
                    : 'bg-error-light text-error border border-error/30'
                }`}
              >
                {product.stock > 0 ? `In Stock (${product.stock} units available)` : 'Out of Stock'}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold font-heading text-text-primary">Product Story & Overview</h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Sustainability Tags */}
            {product.sustainabilityTags?.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Sustainability Impact Verified
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.sustainabilityTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1.5 bg-primary-light text-primary text-xs px-3 py-1.5 rounded-lg font-medium border border-primary/20"
                    >
                      <Leaf className="w-3.5 h-3.5 shrink-0" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seller Metadata & Active Add to Cart Button */}
          <div className="bg-background-muted/60 rounded-xl p-4 border border-text-muted/10 space-y-3 mt-6">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Seller: <strong className="text-text-primary">{product.seller?.name || 'Local Producer'}</strong></span>
              <span className="font-mono text-[11px] bg-background-card px-2 py-0.5 rounded border">
                Role: {product.seller?.role}
              </span>
            </div>

            <button
              onClick={() => addToCartMutation.mutate()}
              disabled={product.stock === 0 || addToCartMutation.isPending}
              className={`w-full py-3.5 font-semibold text-sm rounded-xl transition-all shadow-soft flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 ${
                added
                  ? 'bg-success text-white'
                  : 'bg-primary text-white hover:bg-primary-hover'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Shopping Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Traceability Timeline */}
      {product.traceabilityStages && (
        <TraceabilityTimeline stages={product.traceabilityStages as any} />
      )}
    </div>
  );
}
