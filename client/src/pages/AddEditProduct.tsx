import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Product } from '../types/product';
import { ArrowLeft, Upload, Plus, X, Leaf, RefreshCw, AlertCircle, CheckCircle2, Sprout, Video, Search } from 'lucide-react';

const CATEGORIES = ['Food & Spices', 'Artisan Crafts', 'Eco Living', 'Organic Produce', 'Home & Personal Care'];
const SUGGESTED_TAGS = ['Organically Grown', 'Zero Pesticides', 'Direct Trade', 'Handmade', 'Plastic-Free', 'Fair Wage', 'Recyclable Glass', 'Biodegradable'];

export default function AddEditProduct() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();

  const userRole = (clerkUser?.publicMetadata?.role as string) || 'CUSTOMER';
  const isFarmerOrArtisan = userRole === 'FARMER' || userRole === 'ARTISAN';

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<string>('Food & Spices');
  const [stock, setStock] = useState<string>('10');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5');
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [seoTitle, setSeoTitle] = useState<string>('');
  const [seoDescription, setSeoDescription] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [sustainabilityTags, setSustainabilityTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState<string>('');

  // Producer info state for Farmers/Artisans
  const [producerName, setProducerName] = useState<string>('');
  const [producerLocation, setProducerLocation] = useState<string>('');
  const [producerStory, setProducerStory] = useState<string>('');

  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch existing product data if in edit mode
  const { data: existingData, isLoading: loadingExisting } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: any }>(`/products/${id}`);
      return res.data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingData?.data) {
      const prod = existingData.data;
      setTitle(prod.title || '');
      setDescription(prod.description || '');
      setPrice(String(prod.price || ''));
      setCategory(prod.category || 'Food & Spices');
      setStock(String(prod.stock ?? 10));
      setLowStockThreshold(String(prod.lowStockThreshold ?? 5));
      setImages(prod.images || []);
      setVideoUrl(prod.videoUrl || '');
      setSeoTitle(prod.seoTitle || '');
      setSeoDescription(prod.seoDescription || '');
      setSustainabilityTags(prod.sustainabilityTags || []);

      if (prod.producer) {
        setProducerName(prod.producer.name || '');
        setProducerLocation(prod.producer.location || '');
        setProducerStory(prod.producer.story || '');
      }
    }
  }, [existingData]);

  // Handle Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('image', file);

      const res = await apiClient.post<{ success: boolean; data: { url: string } }>(
        '/products/upload-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setImages((prev) => [...prev, res.data.data.url]);
    } catch (err: any) {
      setFormError(
        err.response?.data?.error?.message || 'Failed to upload image. Please try again.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const addImageUrl = () => {
    if (imageUrlInput.trim() && imageUrlInput.startsWith('http')) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTag = (tag: string) => {
    setSustainabilityTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !sustainabilityTags.includes(customTag.trim())) {
      setSustainabilityTags((prev) => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  // Submit Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const payload: any = {
        title,
        description,
        price: Number(price),
        category,
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'],
        videoUrl: videoUrl.trim() || undefined,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        sustainabilityTags,
      };

      if (isFarmerOrArtisan && producerName.trim()) {
        payload.producerData = {
          name: producerName.trim(),
          location: producerLocation.trim() || 'Local Region',
          story: producerStory.trim(),
        };
      }

      if (isEditMode) {
        await apiClient.put(`/products/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await apiClient.post('/products', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/seller/products');
    },
    onError: (err: any) => {
      setFormError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to save product. Please check form entries.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title || !description || !price || !category) {
      setFormError('Please fill in all required product details.');
      return;
    }

    saveMutation.mutate();
  };

  if (loadingExisting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading product for editing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-text-muted/15 pb-6">
        <div className="space-y-1">
          <Link
            to="/seller/products"
            className="flex items-center space-x-1 text-xs text-text-secondary hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Products</span>
          </Link>
          <h1 className="text-3xl font-bold font-heading text-primary">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-text-secondary">
            List your sustainable items in the marketplace catalog
          </p>
        </div>
      </div>

      {/* Form Error Banner */}
      {formError && (
        <div className="bg-error-light border border-error/30 rounded-2xl p-4 text-error flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{formError}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-8">
        {/* Basic Details Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-heading text-primary border-b border-text-muted/10 pb-2">
            1. General Product Information
          </h2>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-primary">
              Product Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Lakadong Turmeric Powder"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                Category <span className="text-error">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                Price (₹) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="1"
                placeholder="499.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                Stock <span className="text-error">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                Low Stock Alert Limit
              </label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-primary">
              Product Description <span className="text-error">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe the product, its origin, ingredients, and usage details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            ></textarea>
          </div>
        </div>

        {/* Product Media Gallery Section (Images & Video) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-heading text-primary border-b border-text-muted/10 pb-2">
            2. Product Media Gallery (Images & Video)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload File Input */}
            <div className="border-2 border-dashed border-text-muted/25 rounded-2xl p-6 text-center bg-background-muted/40 hover:bg-background-muted/70 transition-colors flex flex-col items-center justify-center space-y-2">
              <Upload className="w-8 h-8 text-primary" />
              <div className="text-xs font-semibold text-text-primary">
                Upload Image File (Multiple Images Supported)
              </div>
              <p className="text-[11px] text-text-muted">PNG, JPG, WEBP up to 5MB</p>
              <label className="px-4 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover transition-colors cursor-pointer shadow-soft">
                {uploadingImage ? 'Uploading...' : 'Browse Image File'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Direct URL Input */}
            <div className="space-y-3 flex flex-col justify-center">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">
                  Or Attach Direct Image URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="px-4 py-2 bg-background-muted hover:bg-text-muted/10 text-xs font-semibold rounded-xl border border-text-muted/20"
                  >
                    Attach
                  </button>
                </div>
              </div>

              {/* Product Video Showcase URL */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary flex items-center space-x-1">
                  <Video className="w-3.5 h-3.5 text-secondary" />
                  <span>Product Video Showcase URL (Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/embed/... or mp4 video link"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-text-secondary">Attached Image Previews ({images.length}):</label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-text-muted/20 group">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-error text-white rounded-full opacity-90 hover:opacity-100 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SEO Metadata Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-heading text-primary border-b border-text-muted/10 pb-2 flex items-center space-x-2">
            <Search className="w-4 h-4 text-primary" />
            <span>3. SEO & Search Engine Metadata</span>
          </h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                SEO Meta Title
              </label>
              <input
                type="text"
                maxLength={70}
                placeholder="Custom Search Title (defaults to product title if blank)"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-[10px] text-text-muted">{seoTitle.length}/70 characters</span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                SEO Meta Description
              </label>
              <textarea
                rows={2}
                maxLength={160}
                placeholder="Compelling meta description for search engine snippets..."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              ></textarea>
              <span className="text-[10px] text-text-muted">{seoDescription.length}/160 characters</span>
            </div>
          </div>
        </div>

        {/* Sustainability Tags */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-heading text-primary border-b border-text-muted/10 pb-2">
            4. Sustainability Impact Badges
          </h2>

          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((tag) => {
              const active = sustainabilityTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-white shadow-soft ring-2 ring-primary/30'
                      : 'bg-background-muted text-text-secondary border border-text-muted/20 hover:border-primary/40'
                  }`}
                >
                  <Leaf className="w-3 h-3" />
                  <span>{tag}</span>
                  {active && <CheckCircle2 className="w-3 h-3 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Custom Tag Input */}
          <div className="flex items-center space-x-2 pt-2 max-w-sm">
            <input
              type="text"
              placeholder="Add custom sustainability tag..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="px-3 py-1.5 bg-background-muted text-text-primary hover:bg-text-muted/10 text-xs font-semibold rounded-xl border border-text-muted/20 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Tag</span>
            </button>
          </div>
        </div>

        {/* Producer Linkage Section (for Farmers / Artisans) */}
        {isFarmerOrArtisan && (
          <div className="bg-primary-light/40 rounded-2xl p-6 border border-primary/20 space-y-4">
            <div className="flex items-center space-x-2 text-primary font-bold font-heading">
              <Sprout className="w-5 h-5" />
              <h2 className="text-base">Producer Profile Linkage (Farmer / Artisan)</h2>
            </div>
            <p className="text-xs text-text-secondary">
              As a verified producer, link your farm/craft origin details to this product for traceability.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">Producer / Farm Name</label>
                <input
                  type="text"
                  placeholder="e.g. Patel Organic Farms"
                  value={producerName}
                  onChange={(e) => setProducerName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-background-card border border-text-muted/20 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-primary">Location / Origin</label>
                <input
                  type="text"
                  placeholder="e.g. Anand, Gujarat, India"
                  value={producerLocation}
                  onChange={(e) => setProducerLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-background-card border border-text-muted/20 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">Producer Story / Sustainable Practices</label>
              <textarea
                rows={2}
                placeholder="Share your farm or craft heritage, zero-chemical practices, and community impact..."
                value={producerStory}
                onChange={(e) => setProducerStory(e.target.value)}
                className="w-full px-3.5 py-2 bg-background-card border border-text-muted/20 rounded-xl text-xs"
              ></textarea>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-text-muted/10">
          <Link
            to="/seller/products"
            className="px-5 py-2.5 bg-background-muted text-text-primary hover:bg-text-muted/10 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-2.5 bg-primary text-white hover:bg-primary-hover font-semibold text-xs rounded-xl transition-all shadow-soft flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {saveMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{isEditMode ? 'Update Product' : 'Publish Product to Shop'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
