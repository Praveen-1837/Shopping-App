import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { PromoBanner } from '../types/banner';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Check,
  X,
  Upload,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';

export default function AdminBanners() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch All Banners (Admin)
  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: PromoBanner[] }>({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: PromoBanner[] }>('/admin/banners', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const banners = data?.data || [];

  // Reset form
  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setCtaText('');
    setCtaLink('');
    setOrder(0);
    setIsActive(true);
    setEditingBanner(null);
    setFormError(null);
    setIsFormOpen(false);
  };

  // Open Edit Form
  const handleStartEdit = (b: PromoBanner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setImageUrl(b.imageUrl);
    setCtaText(b.ctaText || '');
    setCtaLink(b.ctaLink || '');
    setOrder(b.order);
    setIsActive(b.isActive);
    setIsFormOpen(true);
    setFormError(null);
  };

  // Image File Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.data?.data?.url) {
        setImageUrl(res.data.data.url);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Create / Update Banner Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        imageUrl: imageUrl.trim(),
        ctaText: ctaText.trim() || null,
        ctaLink: ctaLink.trim() || null,
        order: Number(order),
        isActive,
      };

      if (editingBanner) {
        await apiClient.put(`/admin/banners/${editingBanner.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await apiClient.post('/admin/banners', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['active-banners'] });
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to save banner');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      await apiClient.delete(`/admin/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['active-banners'] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to delete banner');
    },
  });

  // Toggle Active Mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      await apiClient.patch(`/admin/banners/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['active-banners'] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to toggle banner');
    },
  });

  // Reorder Handler (Swap order with adjacent item)
  const handleReorder = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const currentBanner = banners[currentIndex];
    const targetBanner = banners[targetIndex];

    try {
      const token = await getToken();
      await Promise.all([
        apiClient.put(
          `/admin/banners/${currentBanner.id}`,
          { order: targetBanner.order },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        apiClient.put(
          `/admin/banners/${targetBanner.id}`,
          { order: currentBanner.order },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['active-banners'] });
    } catch (_err) {
      alert('Failed to reorder banners.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      setFormError('Title and Image URL are required.');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/15 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Homepage Marketing</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-text-primary">
            Hero Promotional Banners
          </h1>
          <p className="text-xs text-text-secondary">
            Manage full-width homepage hero carousel slides, CTA links, display order, and active status.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setOrder(banners.length);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-soft transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 bg-error-light border border-error/30 text-error rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
          <button onClick={() => setFormError(null)} className="text-error hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add / Edit Banner Drawer / Form Modal */}
      {isFormOpen && (
        <div className="bg-background-card rounded-3xl p-6 sm:p-8 border border-primary/30 shadow-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-text-muted/10 pb-4">
            <h2 className="font-heading font-bold text-lg text-primary flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span>{editingBanner ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}</span>
            </h2>
            <button
              onClick={resetForm}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary">
                  Banner Heading / Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artisanal Organic Spices & Oils"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary">
                  Subtitle / Tagline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handcrafted directly by local organic micro-farmers"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* CTA Text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary">
                  Button Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop Collection →"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* CTA Link */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary">
                  Button Destination Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /shop?category=Food%20%26%20Spices"
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-primary">
                  Display Order Position
                </label>
                <input
                  type="number"
                  min="0"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Is Active Toggle */}
              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="block text-xs font-bold text-text-primary mb-1">
                  Active Status
                </label>
                <label className="inline-flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-xs text-text-secondary font-medium">
                    {isActive ? 'Published (Visible in Carousel)' : 'Hidden (Draft / Inactive)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Banner Image Selection & Upload */}
            <div className="space-y-2 pt-2 border-t border-text-muted/10">
              <label className="block text-xs font-bold text-text-primary">
                Banner Image <span className="text-error">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Upload File Input */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-text-muted block">Upload image file:</span>
                  <label className="flex items-center justify-center space-x-2 px-4 py-3 bg-background-muted border border-dashed border-text-muted/40 rounded-xl text-xs font-bold text-text-primary hover:border-primary transition-colors cursor-pointer">
                    {isUploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Upload className="w-4 h-4 text-primary" />
                    )}
                    <span>{isUploading ? 'Uploading...' : 'Choose Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct Image URL input */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-text-muted block">Or enter image URL:</span>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Image Preview Box */}
              {imageUrl && (
                <div className="relative mt-3 rounded-2xl overflow-hidden h-36 border border-text-muted/20 shadow-inner group">
                  <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold px-3 py-1 bg-black/60 rounded-lg backdrop-blur-xs">
                      Banner Preview
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-text-muted/10">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 bg-background-muted hover:bg-text-muted/10 text-text-secondary text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending || !title.trim() || !imageUrl.trim()}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-soft transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saveMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{editingBanner ? 'Save Changes' : 'Create Banner'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-6">
        <div className="flex items-center justify-between border-b border-text-muted/10 pb-4">
          <h2 className="font-heading font-bold text-xl text-text-primary flex items-center space-x-2">
            <span>Configured Banners</span>
            <span className="text-xs font-normal text-text-muted">({banners.length} total)</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading promotional banners...</p>
          </div>
        ) : isError ? (
          <div className="p-4 bg-error-light border border-error/30 text-error rounded-xl text-xs font-bold">
            {(error as any)?.response?.data?.error?.message || 'Failed to load banners'}
          </div>
        ) : banners.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted space-y-2">
            <p className="font-semibold text-text-primary">No promotional banners configured yet.</p>
            <p>The homepage hero carousel will stay hidden until you create your first active banner.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((b, idx) => (
              <div
                key={b.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  b.isActive
                    ? 'bg-background-card border-text-muted/20 shadow-xs'
                    : 'bg-background-muted/50 border-text-muted/10 opacity-75'
                }`}
              >
                {/* Banner Media & Information */}
                <div className="flex items-center space-x-4">
                  {/* Image Thumbnail */}
                  <div className="relative w-28 h-16 rounded-xl overflow-hidden shrink-0 border border-text-muted/15 bg-background-muted">
                    <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Text details */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-heading font-bold text-sm text-text-primary">{b.title}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          b.isActive
                            ? 'bg-success-light text-success border-success/30'
                            : 'bg-background-muted text-text-muted border-text-muted/20'
                        }`}
                      >
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {b.subtitle && <p className="text-xs text-text-secondary line-clamp-1">{b.subtitle}</p>}

                    {b.ctaText && b.ctaLink && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-primary font-medium pt-0.5">
                        <LinkIcon className="w-3 h-3" />
                        <span>
                          Button: "{b.ctaText}" → <code className="font-mono text-text-muted">{b.ctaLink}</code>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions: Reorder, Edit, Toggle, Delete */}
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {/* Reorder Buttons */}
                  <div className="flex items-center space-x-1 bg-background-muted p-1 rounded-xl border border-text-muted/15">
                    <button
                      onClick={() => handleReorder(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-text-muted hover:text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReorder(idx, 'down')}
                      disabled={idx === banners.length - 1}
                      className="p-1 text-text-muted hover:text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Toggle Active Button */}
                  <button
                    onClick={() => toggleMutation.mutate(b.id)}
                    disabled={toggleMutation.isPending}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      b.isActive
                        ? 'bg-success-light text-success border-success/30 hover:bg-success/20'
                        : 'bg-background-muted text-text-muted border-text-muted/20 hover:text-text-primary'
                    }`}
                    title={b.isActive ? 'Deactivate Banner' : 'Activate Banner'}
                  >
                    {b.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleStartEdit(b)}
                    className="p-2 bg-primary-light text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-colors cursor-pointer"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete banner "${b.title}"?`)) {
                        deleteMutation.mutate(b.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 bg-error-light text-error border border-error/30 rounded-xl hover:bg-error/20 transition-colors cursor-pointer"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
