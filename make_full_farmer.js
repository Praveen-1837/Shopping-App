const fs = require('fs');

const content = `import React, { useState } from 'react';
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
  Sprout, PlusCircle, Package, IndianRupee, Truck, Trash2, Edit, Video, Eye, X, ArrowUp, ArrowDown, Image as ImageIcon, ArrowLeft
} from 'lucide-react';

interface AnalyticsData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface ProductMedia {
  id: string;
  type: 'upload' | 'url' | 'video';
  url: string; 
  file?: File; 
}

export default function FarmerCentre() {
  const { getToken, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit, setOrderLimit] = useState(10);
  const [orderStatus, setOrderStatus] = useState<string>(''); 
  const queryClient = useQueryClient();

  // Products list states
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(12);

  // Multiple Images State
  const [productImages, setProductImages] = useState<ProductMedia[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageInputModal, setShowImageInputModal] = useState(false);

  // Image Input Modal States
  const [mediaInputMethod, setMediaInputMethod] = useState<'upload' | 'url' | 'video'>('upload');
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [mediaError, setMediaError] = useState<string | null>(null);

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

  const { data: analyticsResponse, isLoading: analyticsLoading } = useQuery({
    queryKey: ['farmerAnalytics'],
    queryFn: async () => {
      const token = await getToken();
      const { data } = await apiClient.get('/seller/analytics', {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return data;
    },
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000
  });

  const analyticsData = analyticsResponse?.data || { totalProducts: 0, totalOrders: 0, totalRevenue: 0 };

  const { data: ordersResponse, isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useQuery({
    queryKey: ['sellerOrders', orderPage, orderLimit, orderStatus],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams({
        page: String(orderPage),
        limit: String(orderLimit),
        ...(orderStatus && { status: orderStatus })
      });
      const { data } = await apiClient.get(\`/seller/orders?\${params.toString()}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return data;
    },
    enabled: !!isSignedIn && activeTab === 'fulfillment',
    staleTime: 1 * 60 * 1000
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
      const { data } = await apiClient.get(\`/seller/products?\${params.toString()}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return data;
    },
    enabled: !!isSignedIn && activeTab === 'dashboard',
    staleTime: 2 * 60 * 1000
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const token = await getToken();
      const { data } = await apiClient.post(
        '/seller/product',
        productData,
        { headers: { Authorization: \`Bearer \${token}\` } }
      );
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Product created:', data.name);
      resetProductForm();
      setProductImages([]);
      setShowAddProductModal(false);
      queryClient.invalidateQueries({ queryKey: ['farmerAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      alert(\`\${data.name} added successfully!\`);
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || 'Failed to create product';
      console.error('❌ Product creation failed:', message);
      alert(message);
    }
  });

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ecomarket_products');
      formData.append('cloud_name', 'hzjhhalf');
      formData.append('folder', 'ecomarket/products');
      formData.append('quality', 'auto:good');
      formData.append('fetch_format', 'auto');

      const response = await fetch('https://api.cloudinary.com/v1_1/hzjhhalf/image/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Cloudinary upload failed');

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    const ytMatch = trimmed.match(/(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([^"&?\\/\\s]{11})/i);
    if (ytMatch && ytMatch[1]) return \`https://www.youtube.com/embed/\${ytMatch[1]}\`;
    const vimeoMatch = trimmed.match(/vimeo\\.com\\/(?:.*#|.*\\/videos\\/)?([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) return \`https://player.vimeo.com/video/\${vimeoMatch[1]}\`;
    const dmMatch = trimmed.match(/dailymotion\\.com\\/(?:video|embed\\/video)\\/(.*)/i);
    if (dmMatch && dmMatch[1]) return \`https://www.dailymotion.com/embed/video/\${dmMatch[1].split('?')[0]}\`;
    return null;
  };

  // Image Modal Handlers
  const openImageModal = () => {
    setMediaInputMethod('upload');
    setCurrentImageFile(null);
    setCurrentImagePreview(null);
    setCurrentImageUrl('');
    setCurrentVideoUrl('');
    setMediaError(null);
    setShowImageInputModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMediaError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMediaError('Image size must be less than 5MB');
      return;
    }
    setMediaError(null);
    setCurrentImageFile(file);
    setCurrentImagePreview(URL.createObjectURL(file));
  };

  const validateAndAddMedia = () => {
    if (mediaInputMethod === 'upload') {
      if (!currentImageFile || !currentImagePreview) {
        setMediaError('Please select a file first.');
        return;
      }
      setProductImages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        type: 'upload',
        url: currentImagePreview,
        file: currentImageFile
      }]);
    } else if (mediaInputMethod === 'url') {
      if (!currentImageUrl.trim()) {
        setMediaError('Please enter a valid URL.');
        return;
      }
      try {
        new URL(currentImageUrl);
        setProductImages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          type: 'url',
          url: currentImageUrl.trim()
        }]);
      } catch {
        setMediaError('Invalid URL format.');
        return;
      }
    } else if (mediaInputMethod === 'video') {
      if (!currentVideoUrl.trim()) {
        setMediaError('Please enter a valid video URL.');
        return;
      }
      const embed = getVideoEmbedUrl(currentVideoUrl);
      if (!embed) {
        setMediaError('Unsupported video URL. Use YouTube, Vimeo, or Dailymotion.');
        return;
      }
      setProductImages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        type: 'video',
        url: currentVideoUrl.trim()
      }]);
    }
    setShowImageInputModal(false);
  };

  const handleRemoveImage = (id: string) => {
    setProductImages(prev => prev.filter(img => img.id !== id));
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setProductImages(prev => {
        const newArr = [...prev];
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
        return newArr;
      });
    } else if (direction === 'down' && index < productImages.length - 1) {
      setProductImages(prev => {
        const newArr = [...prev];
        [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
        return newArr;
      });
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

      setIsUploadingImage(true);
      
      const finalImages: string[] = [];
      let finalVideoUrl: string | null = null;

      for (const media of productImages) {
        if (media.type === 'upload' && media.file) {
          try {
            const uploadedUrl = await uploadImageToCloudinary(media.file);
            finalImages.push(uploadedUrl);
          } catch (error: any) {
            alert(\`Failed to upload one of the images: \${error.message}\`);
            setIsUploadingImage(false);
            return;
          }
        } else if (media.type === 'url') {
          finalImages.push(media.url);
        } else if (media.type === 'video') {
          if (!finalVideoUrl) finalVideoUrl = media.url;
        }
      }

      setIsUploadingImage(false);

      createProductMutation.mutate({
        ...formData,
        price: price,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        images: finalImages,
        image: finalImages[0] || null, 
        videoUrl: finalVideoUrl
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setIsUploadingImage(false);
    }
  };

  const handleProductsPreviousPage = () => { if (productsPage > 1) setProductsPage(productsPage - 1); };
  const handleProductsNextPage = () => { if (productsData?.pagination?.hasMore) setProductsPage(productsPage + 1); };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (confirm(\`Are you sure you want to delete "\${productName}"?\`)) {
      try {
        const token = await getToken();
        await apiClient.delete(\`/seller/product/\${productId}\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
        queryClient.invalidateQueries({ queryKey: ['farmerAnalytics'] });
      } catch (err) {
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handlePreviousPage = () => { if (orderPage > 1) setOrderPage(orderPage - 1); };
  const handleNextPage = () => { if (ordersData?.pagination?.hasMore) setOrderPage(orderPage + 1); };
  const handleStatusFilter = (status: string) => { setOrderStatus(status === orderStatus ? '' : status); setOrderPage(1); };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Friendly Farmer Header */}
      <div className="bg-gradient-to-br from-[#1B2E1E] to-primary text-white rounded-3xl p-8 md:p-12 shadow-card space-y-4 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-sm font-semibold border border-white/20">
            <Sprout className="w-4 h-4 text-secondary" />
            <span>Organic Farmer Portal</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold font-heading tracking-tight">Kisan & Farmer Centre</h1>
          <p className="text-base md:text-base text-white/90 leading-relaxed">
            Simplified tool for local farmers to list fresh harvests, track customer orders, and receive fair market payments directly!
          </p>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Add New Product</h2>
              <button onClick={() => setShowAddProductModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl font-light leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmitProduct(onSubmitProduct)} className="space-y-6">
              {/* SECTION 1: BASIC PRODUCT INFO */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Product Name *</label>
                  <input type="text" placeholder="e.g., Organic Tomatoes" {...registerProduct('name', { required: 'Product name is required' })} className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:ring-2 focus:ring-primary/50" />
                  {productErrors.name && <p className="text-red-500 text-sm mt-1">{productErrors.name.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Description</label>
                  <textarea placeholder="Describe your product (optional)" {...registerProduct('description')} rows={3} className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Price (₹) *</label>
                    <input type="number" step="0.01" min="0" placeholder="45.00" {...registerProduct('price', { required: 'Price is required' })} className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:ring-2 focus:ring-primary/50" />
                    {productErrors.price && <p className="text-red-500 text-sm mt-1">{productErrors.price.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Category *</label>
                    <select {...registerProduct('category', { required: 'Category is required' })} className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:ring-2 focus:ring-primary/50">
                      <option value="">Select Category</option>
                      <option value="ORGANIC_PRODUCE">Organic Produce</option>
                      <option value="ARTISAN_CRAFTS">Artisan Crafts</option>
                      <option value="ECO_LIVING">Eco Living</option>
                      <option value="FOOD_SPICES">Food & Spices</option>
                    </select>
                    {productErrors.category && <p className="text-red-500 text-sm mt-1">{productErrors.category.message as string}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Quantity</label>
                    <input type="number" min="0" placeholder="100" {...registerProduct('quantity')} className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-1">Unit</label>
                    <select {...registerProduct('unit')} className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:ring-2 focus:ring-primary/50">
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
                  <label className="block text-sm font-bold text-text-primary mb-1">SKU (Optional)</label>
                  <input type="text" placeholder="ORG-TOM-001" {...registerProduct('sku')} className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>

              {/* SECTION 2: PRODUCT IMAGES (MULTIPLE) */}
              <div className="border border-border-muted rounded-xl p-5 bg-gray-50/50 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Product Images</h3>
                  <p className="text-xs text-text-muted mt-0.5">(Add multiple images to showcase your product. First image is primary.)</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productImages.map((media, index) => (
                    <div key={media.id} className="relative group bg-white border border-border-muted rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                      <div className="aspect-square w-full bg-gray-100 flex items-center justify-center relative">
                        {media.type === 'video' ? (
                          <div className="w-full h-full relative pointer-events-none">
                            <iframe src={getVideoEmbedUrl(media.url)!} className="w-full h-full" frameBorder="0"></iframe>
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img src={media.url} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button type="button" onClick={() => handleRemoveImage(media.id)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm opacity-90 hover:opacity-100 transition z-10">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                          <button type="button" onClick={() => handleMoveImage(index, 'up')} disabled={index === 0} className="p-1 bg-white/90 rounded text-text-primary hover:bg-white disabled:opacity-30 shadow-sm"><ArrowLeft className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => handleMoveImage(index, 'down')} disabled={index === productImages.length - 1} className="p-1 bg-white/90 rounded text-text-primary hover:bg-white disabled:opacity-30 shadow-sm"><ArrowRight className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="px-2 py-1.5 bg-white border-t border-border-muted flex items-center justify-between">
                        <span className="text-[10px] font-bold text-text-muted uppercase">{media.type}</span>
                        {index === 0 && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 rounded">PRIMARY</span>}
                      </div>
                    </div>
                  ))}
                  {productImages.length < 10 && (
                    <button type="button" onClick={openImageModal} className="aspect-square w-full rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5 transition bg-white">
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-bold">Add Image</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION 3: FORM ACTIONS */}
              {createProductMutation.isError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-900">{(createProductMutation.error as AxiosError<any>)?.response?.data?.message || 'Failed to create product'}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-6 border-t border-border-muted mt-6">
                <button type="button" onClick={() => setShowAddProductModal(false)} className="px-6 py-3 font-bold text-text-primary bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={isUploadingImage || isSubmittingProduct || createProductMutation.isPending} className="px-8 py-3 font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-70 disabled:cursor-not-allowed rounded-xl transition flex items-center gap-2">
                  {isUploadingImage || createProductMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Adding Product...</> : <><Plus className="w-5 h-5" /> Add Product</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE INPUT MODAL (Nested) */}
      {showImageInputModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-text-primary">Add Media Source</h3>
              <button onClick={() => setShowImageInputModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg mb-5">
              <button onClick={() => { setMediaInputMethod('upload'); setMediaError(null); }} className={\`flex-1 py-2 text-sm font-bold rounded-md transition \${mediaInputMethod === 'upload' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}\`}>📁 Upload</button>
              <button onClick={() => { setMediaInputMethod('url'); setMediaError(null); }} className={\`flex-1 py-2 text-sm font-bold rounded-md transition \${mediaInputMethod === 'url' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}\`}>🔗 URL</button>
              <button onClick={() => { setMediaInputMethod('video'); setMediaError(null); }} className={\`flex-1 py-2 text-sm font-bold rounded-md transition \${mediaInputMethod === 'video' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}\`}>🎥 Video</button>
            </div>
            <div className="space-y-4">
              {mediaInputMethod === 'upload' && (
                <div>
                  {currentImagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border-muted h-40 mb-3">
                      <img src={currentImagePreview} className="w-full h-full object-cover" alt="Preview" />
                      <button onClick={() => { setCurrentImageFile(null); setCurrentImagePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="h-40 border-2 border-dashed border-border-muted rounded-xl flex flex-col items-center justify-center bg-gray-50 mb-3 relative">
                      <ImageIcon className="w-8 h-8 text-text-muted mb-2" />
                      <span className="text-sm font-bold text-text-muted">Click to browse file</span>
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                  <p className="text-xs text-text-muted text-center">JPG, PNG, WebP. Max 5MB</p>
                </div>
              )}
              {mediaInputMethod === 'url' && (
                <div>
                  <input type="url" value={currentImageUrl} onChange={e => setCurrentImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white mb-2 focus:ring-2 focus:ring-primary/50" />
                  <p className="text-xs text-text-muted">Paste Cloudinary, Imgur, Unsplash URL, etc</p>
                  {currentImageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border-muted h-40">
                      <img src={currentImageUrl} onError={() => setMediaError("Could not load image from URL")} className="w-full h-full object-cover" alt="URL Preview" />
                    </div>
                  )}
                </div>
              )}
              {mediaInputMethod === 'video' && (
                <div>
                  <input type="url" value={currentVideoUrl} onChange={e => setCurrentVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white mb-2 focus:ring-2 focus:ring-primary/50" />
                  <p className="text-xs text-text-muted">YouTube, Vimeo, Dailymotion URLs supported</p>
                  {currentVideoUrl && getVideoEmbedUrl(currentVideoUrl) && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border-muted aspect-video bg-black">
                      <iframe src={getVideoEmbedUrl(currentVideoUrl)!} className="w-full h-full" frameBorder="0"></iframe>
                    </div>
                  )}
                </div>
              )}
              {mediaError && <p className="text-sm text-red-500 font-medium text-center">{mediaError}</p>}
            </div>
            <div className="flex gap-3 mt-6 pt-5 border-t border-border-muted">
              <button onClick={() => { setCurrentImageFile(null); setCurrentImagePreview(null); setCurrentImageUrl(''); setCurrentVideoUrl(''); setMediaError(null); }} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">Clear</button>
              <div className="flex-1"></div>
              <button onClick={() => setShowImageInputModal(false)} className="px-4 py-2 text-sm font-bold text-text-primary bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
              <button onClick={validateAndAddMedia} className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition">Add Image</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div className="flex gap-2 border-b border-border-muted overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setActiveTab('dashboard')} className={\`px-6 py-4 font-bold whitespace-nowrap border-b-2 transition \${activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}\`}>Dashboard</button>
        <button onClick={() => setActiveTab('add-products')} className={\`px-6 py-4 font-bold whitespace-nowrap border-b-2 transition \${activeTab === 'add-products' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}\`}>Products</button>
        <button onClick={() => setActiveTab('fulfillment')} className={\`px-6 py-4 font-bold whitespace-nowrap border-b-2 transition \${activeTab === 'fulfillment' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}\`}>Fulfillment Orders</button>
      </div>

      {/* TAB CONTENT: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background-card border-2 border-secondary/20 rounded-3xl p-8 shadow-soft space-y-3">
              <div className="p-4 bg-secondary-light text-secondary rounded-2xl w-fit"><IndianRupee className="w-8 h-8" /></div>
              <div><span className="text-sm font-bold text-text-muted uppercase tracking-wider block">Total Farm Revenue</span><span className="text-3xl font-black font-heading text-secondary">₹{analyticsData.totalRevenue.toLocaleString('en-IN')}</span></div>
            </div>
            <div className="bg-background-card border-2 border-primary/20 rounded-3xl p-8 shadow-soft space-y-3">
              <div className="p-4 bg-primary-light text-primary rounded-2xl w-fit"><Package className="w-8 h-8" /></div>
              <div><span className="text-sm font-bold text-text-muted uppercase tracking-wider block">Harvest Produce Listed</span><span className="text-3xl font-black font-heading text-primary">{analyticsData.totalProducts} Items</span></div>
            </div>
            <div className="bg-background-card border-2 border-text-muted/20 rounded-3xl p-8 shadow-soft space-y-3">
              <div className="p-4 bg-background-muted text-text-primary rounded-2xl w-fit border"><Truck className="w-8 h-8 text-secondary" /></div>
              <div><span className="text-sm font-bold text-text-muted uppercase tracking-wider block">Orders Received</span><span className="text-3xl font-black font-heading text-text-primary">{analyticsData.totalOrders} Orders</span></div>
            </div>
          </div>
          
          <hr className="border-border-muted" />

          {/* MY PRODUCTS LIST */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">🌾 Farmer Dashboard</span>
                <h2 className="text-2xl font-black font-heading text-text-primary">My Products Inventory</h2>
                <p className="text-text-muted font-medium mt-1">Manage your active listings, pricing, stock levels, and product details</p>
              </div>
              <button onClick={() => { setActiveTab('add-products'); setShowAddProductModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition shadow-soft">
                <Plus className="w-5 h-5" /> Add New Product
              </button>
            </div>

            {productsLoading ? (
              <div className="py-16 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /><p className="text-text-muted mt-4 font-medium">Loading products...</p></div>
            ) : productsError ? (
              <div className="flex flex-col items-center justify-center py-12 bg-red-50 border border-red-200 rounded-3xl"><AlertCircle className="w-10 h-10 text-red-500 mb-3" /><h3 className="text-lg font-bold text-red-900">Failed to load products</h3><button onClick={() => refetchProducts()} className="mt-4 px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Retry</button></div>
            ) : !productsData?.products || productsData.products.length === 0 ? (
              <div className="text-center py-16 bg-background-card rounded-3xl border border-border-muted shadow-sm"><Package className="w-16 h-16 mx-auto text-text-muted opacity-30 mb-4" /><h3 className="text-xl font-black font-heading text-text-primary">No products yet</h3><p className="text-text-muted font-medium mt-2 max-w-md mx-auto">Click 'Add New Product' to start listing your items</p></div>
            ) : (
              <div className="bg-background-card border border-border-muted rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-background-muted text-text-muted text-xs font-bold uppercase tracking-wider border-b border-border-muted">
                      <tr><th className="px-6 py-4 whitespace-nowrap">Product</th><th className="px-6 py-4 whitespace-nowrap">Category</th><th className="px-6 py-4 whitespace-nowrap">Price</th><th className="px-6 py-4 whitespace-nowrap">Stock</th><th className="px-6 py-4 whitespace-nowrap">Created Date</th><th className="px-6 py-4 whitespace-nowrap text-center">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border-muted">
                      {productsData.products.map((product: any) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {product.images && product.images.length > 0 ? (
                                <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-border-muted flex-shrink-0" />
                              ) : product.image ? (
                                <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-border-muted flex-shrink-0" />
                              ) : product.videoUrl ? (
                                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0"><Video className="w-5 h-5 text-white/70" /></div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-background-muted flex items-center justify-center flex-shrink-0 border border-border-muted"><Package className="w-6 h-6 text-text-muted opacity-50" /></div>
                              )}
                              <div><p className="font-bold text-text-primary line-clamp-1">{product.name}</p><p className="text-xs text-text-muted font-medium mt-0.5">ID: {product.id.substring(0, 8).toUpperCase()}</p></div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full border border-primary/20">{product.category}</span></td>
                          <td className="px-6 py-4"><span className="font-bold text-text-primary">₹{product.price.toFixed(2)}</span></td>
                          <td className="px-6 py-4"><span className={\`font-bold text-sm \${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}\`}>{product.quantity > 0 ? \`\${product.quantity} units\` : 'Out of stock'}</span></td>
                          <td className="px-6 py-4 text-sm font-medium text-text-muted">
                            {new Date(product.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                              <button className="p-2 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteProduct(product.id, product.name)} className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {productsData.pagination?.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-border-muted bg-gray-50/50">
                    <p className="text-sm font-medium text-text-muted">Page <span className="font-bold text-text-primary">{productsData.pagination.page}</span> of <span className="font-bold text-text-primary">{productsData.pagination.pages}</span> • {productsData.pagination.total} total products</p>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <button onClick={handleProductsPreviousPage} disabled={productsPage === 1} className="flex items-center gap-1 px-4 py-2 text-sm font-bold bg-white border border-border-muted rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition shadow-sm"><ChevronLeft className="w-4 h-4" /> Prev</button>
                      <button onClick={handleProductsNextPage} disabled={!productsData.pagination.hasMore} className="flex items-center gap-1 px-4 py-2 text-sm font-bold bg-white border border-border-muted rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition shadow-sm">Next <ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ADD PRODUCTS */}
      {activeTab === 'add-products' && (
        <div className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black font-heading text-text-primary">Your Products</h2>
              <p className="text-text-muted mt-1 font-medium">Expand your catalog by adding new products to sell</p>
            </div>
            <button onClick={() => setShowAddProductModal(true)} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition shadow-soft">
              <Plus className="w-5 h-5" /> Add Product
            </button>
          </div>
          {analyticsLoading ? (
            <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>
          ) : (
            <div className="bg-background-card border border-border-muted rounded-2xl p-8 shadow-sm">
              <h3 className="font-bold text-xl text-text-primary mb-2">Total Products: {analyticsData.totalProducts}</h3>
              <p className="text-text-muted font-medium">Head over to the Dashboard to manage your active listings.</p>
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
              <p className="text-text-muted mt-1 font-medium">Manage and fulfill customer orders</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].map(status => (
                <button key={status || 'all'} onClick={() => handleStatusFilter(status)} className={\`px-4 py-2 text-sm rounded-xl font-bold transition \${orderStatus === status ? 'bg-primary text-white shadow-soft' : 'bg-background-muted text-text-primary hover:bg-gray-200'}\`}>
                  {status || 'All'}
                </button>
              ))}
            </div>
          </div>
          {ordersLoading ? (
            <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>
          ) : ordersError ? (
            <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex flex-col items-center">
              <AlertCircle className="w-10 h-10 mb-2" />
              <p className="font-bold">Failed to load orders.</p>
            </div>
          ) : ordersData?.orders?.length === 0 ? (
            <div className="text-center py-16 bg-background-card border border-border-muted rounded-3xl">
              <Package className="w-16 h-16 mx-auto text-text-muted opacity-30 mb-4" />
              <h3 className="text-xl font-bold text-text-primary">No orders yet</h3>
              <p className="text-text-muted">When customers order your products, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ordersData?.orders?.map((order: any) => (
                <div key={order.id} className="bg-white border border-border-muted p-6 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-text-muted font-bold">ORDER #{order.id.substring(0,8).toUpperCase()}</p>
                      <p className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 font-bold text-xs rounded-lg">{order.status}</span>
                  </div>
                  <div className="border-t border-border-muted pt-4">
                    <p className="font-bold text-lg">Total: ₹{order.totalAmount}</p>
                  </div>
                </div>
              ))}
              {ordersData?.pagination?.pages > 1 && (
                <div className="flex justify-between items-center pt-4">
                  <button onClick={handlePreviousPage} disabled={orderPage === 1} className="px-4 py-2 bg-gray-100 rounded-lg font-bold disabled:opacity-50">Prev</button>
                  <span className="text-sm font-bold">{orderPage} / {ordersData.pagination.pages}</span>
                  <button onClick={handleNextPage} disabled={!ordersData.pagination.hasMore} className="px-4 py-2 bg-gray-100 rounded-lg font-bold disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('client/src/pages/FarmerCentre.tsx', content);
