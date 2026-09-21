import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { AxiosError } from 'axios';
import { 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sprout, PlusCircle, Package, IndianRupee, Truck, Trash2, Edit, Video
} from 'lucide-react';

interface AnalyticsData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function FarmerCentre() {
  const { getToken, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit, setOrderLimit] = useState(10);
  const [orderStatus, setOrderStatus] = useState<string>(''); // Filter by status
  const queryClient = useQueryClient();

  // Products list states
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(12);

  // Media Input Method States
  const [mediaInputMethod, setMediaInputMethod] = useState<'upload' | 'imageUrl' | 'videoUrl'>('upload');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [imageUrlError, setImageUrlError] = useState<string | null>(null);
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  
  // Image Upload State
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  
  // Form for adding product
  const {
    register: registerProduct,
    handleSubmit: handleSubmitProduct,
    reset: resetProductForm,
    formState: { errors: productErrors, isSubmitting: isSubmittingProduct }
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category: 'ORGANIC_PRODUCE',
      quantity: '',
      unit: 'kg',
      sku: ''
    }
  });

  // Existing analytics query
  const {
    data: analyticsResponse,
    isLoading: analyticsLoading,
    error: analyticsError
  } = useQuery({
    queryKey: ['farmerAnalytics'],
    queryFn: async () => {
      const token = await getToken();
      const { data } = await apiClient.get('/seller/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const analyticsData = analyticsResponse?.data || { totalProducts: 0, totalOrders: 0, totalRevenue: 0 };

  // NEW: Query for seller orders/fulfillment list
  const {
    data: ordersResponse,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders
  } = useQuery({
    queryKey: ['sellerOrders', orderPage, orderLimit, orderStatus],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams({
        page: String(orderPage),
        limit: String(orderLimit),
        ...(orderStatus && { status: orderStatus })
      });
      const { data } = await apiClient.get(
        `/seller/orders?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return data;
    },
    enabled: !!isSignedIn && activeTab === 'fulfillment',
    staleTime: 1 * 60 * 1000 // 1 minute
  });

  const ordersData = ordersResponse;

  const { data: productsData, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ['sellerProducts', productsPage, productsLimit],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams({
        page: String(productsPage),
        limit: String(productsLimit)
      });
      const { data } = await apiClient.get(`/seller/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    enabled: !!isSignedIn && activeTab === 'dashboard',
    staleTime: 2 * 60 * 1000
  });

  // NEW: Mutation for creating product
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const token = await getToken();
      const { data } = await apiClient.post(
        '/seller/product',
        productData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Product created:', data.name);
      resetProductForm();
      setProductImage(null);
      setImageUrl('');
      setVideoUrl('');
      setImageUploadError(null);
      setImageUrlError(null);
      setVideoUrlError(null);
      setMediaInputMethod('upload');
      (window as any).selectedImageFile = null;
      setShowAddProductModal(false);
      queryClient.invalidateQueries({ queryKey: ['farmerAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      alert(`${data.name} added successfully!`); // simple fallback for toast
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || 'Failed to create product';
      console.error('❌ Product creation failed:', message);
      alert(message); // simple fallback for toast
    }
  });

  /**
   * Upload image file to Cloudinary and return secure URL
   */
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ecomarket_products');
      formData.append('cloud_name', 'hzjhhalf');
      formData.append('folder', 'ecomarket/products');
      formData.append('quality', 'auto:good');
      formData.append('fetch_format', 'auto');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/hzjhhalf/image/upload',
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Cloudinary upload failed');

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setImageUploadError('Image size must be less than 5MB');
      return;
    }

    setImageUploadError(null);
    const previewUrl = URL.createObjectURL(file);
    setProductImage(previewUrl);
    (window as any).selectedImageFile = file;
  };

  const handleImageUrlChange = (url: string) => {
    const trimmed = url.trim();
    setImageUrl(trimmed);
    if (!trimmed) {
      setImageUrlError(null);
      setProductImage(null);
      return;
    }
    
    try {
      new URL(trimmed); // Validate URL format
      setImageUrlError(null);
      setProductImage(trimmed);
    } catch {
      setImageUrlError('Please enter a valid URL');
      setProductImage(null);
    }
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    
    // YouTube
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    
    // Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    
    // Dailymotion
    const dmMatch = trimmed.match(/dailymotion\.com\/(?:video|embed\/video)\/(.*)/i);
    if (dmMatch && dmMatch[1]) return `https://www.dailymotion.com/embed/video/${dmMatch[1].split('?')[0]}`;
    
    return null;
  };

  const handleVideoUrlChange = (url: string) => {
    const trimmed = url.trim();
    setVideoUrl(trimmed);
    
    if (!trimmed) {
      setVideoUrlError(null);
      return;
    }
    
    const embedUrl = getVideoEmbedUrl(trimmed);
    if (embedUrl) {
      setVideoUrlError(null);
    } else {
      setVideoUrlError('Unsupported video URL. Please use YouTube, Vimeo, or Dailymotion.');
    }
  };

  const onSubmitProduct = async (formData: any) => {
    try {
      const price = Number(formData.price);
      if (isNaN(price) || price <= 0) {
        alert('Price must be a positive number');
        return;
      }

      if (!formData.name?.trim()) {
        alert('Product name is required');
        return;
      }

      let finalImageUrl: string | null = null;
      let finalVideoUrl: string | null = null;

      if (mediaInputMethod === 'upload' && (window as any).selectedImageFile) {
        setIsUploadingImage(true);
        try {
          finalImageUrl = await uploadImageToCloudinary((window as any).selectedImageFile);
          console.log('✅ Image uploaded:', finalImageUrl);
        } catch (error: any) {
          setImageUploadError(error.message || 'Failed to upload image');
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      } else if (mediaInputMethod === 'imageUrl' && imageUrl && !imageUrlError) {
        finalImageUrl = imageUrl;
      } else if (mediaInputMethod === 'videoUrl' && videoUrl && !videoUrlError) {
        finalVideoUrl = videoUrl;
      }

      createProductMutation.mutate({
        ...formData,
        price: price,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        image: finalImageUrl,
        videoUrl: finalVideoUrl
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleProductsPreviousPage = () => { if (productsPage > 1) setProductsPage(productsPage - 1); };
  const handleProductsNextPage = () => { if (productsData?.pagination?.hasMore) setProductsPage(productsPage + 1); };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        const token = await getToken();
        await apiClient.delete(`/seller/product/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
        queryClient.invalidateQueries({ queryKey: ['farmerAnalytics'] });
      } catch (err) {
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  // Handler: Pagination
  const handlePreviousPage = () => {
    if (orderPage > 1) setOrderPage(orderPage - 1);
  };

  const handleNextPage = () => {
    if (ordersData?.pagination?.hasMore) setOrderPage(orderPage + 1);
  };

  // Handler: Filter by status
  const handleStatusFilter = (status: string) => {
    setOrderStatus(status === orderStatus ? '' : status);
    setOrderPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Friendly Farmer Header */}
      <div className="bg-gradient-to-br from-[#1B2E1E] to-primary text-white rounded-3xl p-8 md:p-12 shadow-card space-y-4 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-sm font-semibold border border-white/20">
            <Sprout className="w-4 h-4 text-secondary" />
            <span>Organic Farmer Portal</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold font-heading tracking-tight">
            Kisan & Farmer Centre
          </h1>

          <p className="text-base md:text-base text-white/90 leading-relaxed">
            Simplified tool for local farmers to list fresh harvests, track customer orders, and receive fair market payments directly!
          </p>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Add New Product</h2>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-light leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitProduct(onSubmitProduct)} className="space-y-5">
              {/* Tabbed Media Input Section */}
              <div className="border border-border-muted rounded-xl p-5 space-y-4 bg-background-muted/30">
                <label className="block text-sm font-bold text-text-primary">
                  Product Media
                </label>
                
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-border-muted">
                  <button
                    type="button"
                    onClick={() => setMediaInputMethod('upload')}
                    className={`pb-2 px-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      mediaInputMethod === 'upload' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
                    }`}
                  >
                    📁 Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaInputMethod('imageUrl')}
                    className={`pb-2 px-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      mediaInputMethod === 'imageUrl' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
                    }`}
                  >
                    🔗 Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaInputMethod('videoUrl')}
                    className={`pb-2 px-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      mediaInputMethod === 'videoUrl' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
                    }`}
                  >
                    🎥 Video URL
                  </button>
                </div>

                {/* Content */}
                <div className="pt-3">
                  {mediaInputMethod === 'upload' && (
                    <div className="space-y-3">
                      {productImage && !productImage.startsWith('http') && (
                        <div className="relative">
                          <img src={productImage} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-border-muted" />
                          <button type="button" onClick={() => { setProductImage(null); (window as any).selectedImageFile = null; setImageUploadError(null); }} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-sm">×</button>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageSelect} disabled={isUploadingImage || createProductMutation.isPending} className="w-full px-3 py-2.5 border border-border-muted rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <p className="text-xs text-text-muted font-medium">JPG, PNG or WebP. Max 5MB. Will be uploaded to Cloudinary.</p>
                      {imageUploadError && <p className="text-red-500 text-sm">{imageUploadError}</p>}
                      {isUploadingImage && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Loader2 className="w-4 h-4 animate-spin" /> Uploading image...</div>}
                    </div>
                  )}

                  {mediaInputMethod === 'imageUrl' && (
                    <div className="space-y-3">
                      {productImage && productImage.startsWith('http') && (
                        <div className="relative">
                          <img src={productImage} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-border-muted" />
                          <button type="button" onClick={() => { setImageUrl(''); setProductImage(null); setImageUrlError(null); }} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-sm">×</button>
                        </div>
                      )}
                      <input type="url" value={imageUrl} onChange={(e) => handleImageUrlChange(e.target.value)} placeholder="https://example.com/product-image.jpg" className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <p className="text-xs text-text-muted font-medium">Paste URL from Cloudinary, Imgur, Unsplash, or other image hosting service</p>
                      {imageUrlError && <p className="text-red-500 text-sm">{imageUrlError}</p>}
                      {imageUrl && !imageUrlError && productImage && <p className="text-green-600 text-sm font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> ✅ Image URL loaded successfully</p>}
                    </div>
                  )}

                  {mediaInputMethod === 'videoUrl' && (
                    <div className="space-y-3">
                      {videoUrl && !videoUrlError && getVideoEmbedUrl(videoUrl) && (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-border-muted shadow-sm bg-black">
                          <iframe src={getVideoEmbedUrl(videoUrl)!} width="100%" height="100%" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                          <button type="button" onClick={() => { setVideoUrl(''); setVideoUrlError(null); }} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg z-10 shadow-sm">×</button>
                        </div>
                      )}
                      <input type="url" value={videoUrl} onChange={(e) => handleVideoUrlChange(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <p className="text-xs text-text-muted font-medium">Supported: YouTube, Vimeo, Dailymotion. Paste the full video URL.</p>
                      {videoUrlError && <p className="text-red-500 text-sm">{videoUrlError}</p>}
                      {videoUrl && !videoUrlError && <p className="text-green-600 text-sm font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> ✅ Video loaded successfully</p>}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Organic Tomatoes"
                  {...registerProduct('name', {
                    required: 'Product name is required',
                    minLength: { value: 3, message: 'Name must be at least 3 characters' }
                  })}
                  className="w-full px-4 py-3 border border-border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {productErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{productErrors.name.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe your product (optional)"
                  {...registerProduct('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="45.00"
                    {...registerProduct('price', {
                      required: 'Price is required'
                    })}
                    className="w-full px-4 py-3 border border-border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {productErrors.price && (
                    <p className="text-red-500 text-sm mt-1">{productErrors.price.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">
                    Category *
                  </label>
                  <select
                    {...registerProduct('category', { required: 'Category is required' })}
                    className="w-full px-4 py-3 border border-border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                  >
                    <option value="">Select Category</option>
                    <option value="ORGANIC_PRODUCE">Organic Produce</option>
                    <option value="ARTISAN_CRAFTS">Artisan Crafts</option>
                    <option value="ECO_LIVING">Eco Living</option>
                    <option value="FOOD_SPICES">Food & Spices</option>
                  </select>
                  {productErrors.category && (
                    <p className="text-red-500 text-sm mt-1">{productErrors.category.message as string}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    {...registerProduct('quantity')}
                    className="w-full px-4 py-3 border border-border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">
                    Unit
                  </label>
                  <select
                    {...registerProduct('unit')}
                    className="w-full px-4 py-3 border border-border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="piece">piece</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">
                  SKU (Optional)
                </label>
                <input
                  type="text"
                  placeholder="ORG-TOM-001"
                  {...registerProduct('sku')}
                  className="w-full px-4 py-3 border border-border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {createProductMutation.isError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      {(createProductMutation.error as AxiosError<any>)?.response?.data?.message ||
                        'Failed to create product'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-6 border-t border-border-muted mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-6 py-3 font-bold text-text-primary bg-background-muted hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage || isSubmittingProduct || createProductMutation.isPending}
                  className="px-6 py-3 font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition flex items-center gap-2"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading Image...
                    </>
                  ) : createProductMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Product...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div className="flex gap-2 border-b border-border-muted overflow-x-auto pb-px scrollbar-hide">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-4 font-bold whitespace-nowrap border-b-2 transition ${
            activeTab === 'dashboard'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('add-products')}
          className={`px-6 py-4 font-bold whitespace-nowrap border-b-2 transition ${
            activeTab === 'add-products'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('fulfillment')}
          className={`px-6 py-4 font-bold whitespace-nowrap border-b-2 transition ${
            activeTab === 'fulfillment'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Fulfillment Orders
        </button>
      </div>

      {/* TAB CONTENT: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background-card border-2 border-secondary/20 rounded-3xl p-8 shadow-soft space-y-3">
              <div className="p-4 bg-secondary-light text-secondary rounded-2xl w-fit">
                <IndianRupee className="w-8 h-8" />
              </div>
              <div>
                <span className="text-sm font-bold text-text-muted uppercase tracking-wider block">
                  Total Farm Revenue
                </span>
                <span className="text-3xl font-black font-heading text-secondary">
                  ₹{analyticsData.totalRevenue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="bg-background-card border-2 border-primary/20 rounded-3xl p-8 shadow-soft space-y-3">
              <div className="p-4 bg-primary-light text-primary rounded-2xl w-fit">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <span className="text-sm font-bold text-text-muted uppercase tracking-wider block">
                  Harvest Produce Listed
                </span>
                <span className="text-3xl font-black font-heading text-primary">
                  {analyticsData.totalProducts} Items
                </span>
              </div>
            </div>

            <div className="bg-background-card border-2 border-text-muted/20 rounded-3xl p-8 shadow-soft space-y-3">
              <div className="p-4 bg-background-muted text-text-primary rounded-2xl w-fit border">
                <Truck className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <span className="text-sm font-bold text-text-muted uppercase tracking-wider block">
                  Orders Received
                </span>
                <span className="text-3xl font-black font-heading text-text-primary">
                  {analyticsData.totalOrders} Orders
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ADD PRODUCTS */}
      {activeTab === 'add-products' && (
        <div className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black font-heading text-text-primary">Your Products</h2>
              <p className="text-text-muted mt-1 font-medium">
                Expand your catalog by adding new products to sell
              </p>
            </div>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition shadow-soft"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>

          {analyticsLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
              <p className="text-text-muted mt-4 font-medium">Loading products...</p>
            </div>
          ) : (
            <div className="bg-background-card border border-border-muted rounded-2xl p-8 text-center md:text-left shadow-sm">
              <h3 className="font-bold text-xl text-text-primary mb-2">
                Total Products: {analyticsData.totalProducts}
              </h3>
              <p className="text-text-muted">
                Click the "Add Product" button above to list a new item on the EcoMarket.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FULFILLMENT ORDERS */}
      {activeTab === 'fulfillment' && (
        <div className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black font-heading text-text-primary">Fulfillment Queue</h2>
              <p className="text-text-muted mt-1 font-medium">
                Manage and fulfill customer orders
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].map(status => (
                <button
                  key={status || 'all'}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-4 py-2 text-sm rounded-xl font-bold transition ${
                    orderStatus === status
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-background-muted text-text-primary hover:bg-gray-200'
                  }`}
                >
                  {status || 'All'}
                </button>
              ))}
            </div>
          </div>

          {ordersLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
              <p className="text-text-muted mt-4 font-medium">Loading orders...</p>
            </div>
          )}

          {ordersError && (
            <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-200 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-lg text-red-900">Failed to load orders</p>
                <p className="text-base text-red-700 mt-1">
                  {(ordersError as AxiosError<any>)?.response?.data?.message || 'Please try again later'}
                </p>
                <button
                  onClick={() => refetchOrders()}
                  className="text-sm font-bold text-red-600 hover:text-red-800 mt-3 underline underline-offset-2"
                >
                  Retry Now
                </button>
              </div>
            </div>
          )}

          {!ordersLoading && !ordersError && (!ordersData?.orders || ordersData.orders.length === 0) && (
            <div className="text-center py-16 bg-background-card rounded-3xl border border-border-muted shadow-sm">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-xl text-text-primary font-black font-heading">No orders yet</p>
              <p className="text-text-muted font-medium mt-2">
                Orders will appear here once customers purchase your products
              </p>
            </div>
          )}

          {!ordersLoading && ordersData?.orders && ordersData.orders.length > 0 && (
            <div className="space-y-6">
              {ordersData.orders.map((order: any) => (
                <div
                  key={order.id}
                  className="bg-background-card border border-border-muted rounded-3xl p-6 md:p-8 hover:shadow-card transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-black font-heading text-text-primary">{order.orderNumber}</h3>
                      <p className="font-medium text-text-muted mt-1">
                        {order.customerName} • {order.customerEmail}
                      </p>
                    </div>
                    <div className="md:text-right flex flex-row md:flex-col items-center md:items-end justify-between gap-2">
                      <div className="text-xl font-black font-heading text-secondary">
                        ₹{order.totalAmount.toFixed(2)}
                      </div>
                      <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'PACKED' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-background-muted rounded-2xl p-5 mb-6">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
                      Items Ordered
                    </p>
                    <div className="space-y-4">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-12 h-12 object-cover rounded-xl border border-border-muted"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-bold text-text-primary">{item.productName}</p>
                              <p className="text-text-muted font-medium text-sm mt-0.5">
                                {item.quantity} × ₹{item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-text-primary text-base">
                            ₹{item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
                    <div className="bg-white p-5 rounded-2xl border border-border-muted/50">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                        Delivery Address
                      </p>
                      <p className="text-text-primary font-medium">{order.shippingAddress || 'No address provided'}</p>
                      {order.shippingCity && (
                        <p className="text-text-muted font-medium mt-1">
                          {order.shippingCity}, {order.shippingState} {order.shippingZip}
                        </p>
                      )}
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-border-muted/50">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                        Timeline
                      </p>
                      <p className="text-text-primary font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                      <p className="text-text-muted font-medium mt-1">Order Placed</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button className="flex-1 px-4 py-3 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition shadow-soft">
                      Update Status
                    </button>
                    <button className="flex-1 px-4 py-3 text-sm font-bold text-text-primary bg-background-muted hover:bg-gray-200 border border-border-muted rounded-xl transition">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {ordersData?.pagination && ordersData.pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4">
              <p className="text-sm font-medium text-text-muted">
                Page {ordersData.pagination.page} of {ordersData.pagination.pages} •{' '}
                {ordersData.pagination.total} total orders
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handlePreviousPage}
                  disabled={orderPage === 1}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold text-text-primary bg-white border border-border-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!ordersData.pagination.hasMore}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold text-text-primary bg-white border border-border-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-sm"
                >
                  Next
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
