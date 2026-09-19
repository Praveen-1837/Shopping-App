import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { FolderTree, Plus, Edit2, Trash2, Check, X, RefreshCw, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  imageUrl?: string | null;
  createdAt: string;
}

export default function AdminCategories() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Categories Query
  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Category[] }>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: Category[] }>('/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const categories = data?.data || [];

  // Upload handler for category image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
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
        if (isEdit) {
          setEditImageUrl(res.data.data.url);
        } else {
          setNewCategoryImageUrl(res.data.data.url);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Create Category Mutation
  const createMutation = useMutation({
    mutationFn: async ({ name, imageUrl }: { name: string; imageUrl: string }) => {
      const token = await getToken();
      await apiClient.post(
        '/admin/categories',
        { name, imageUrl: imageUrl.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setNewCategoryName('');
      setNewCategoryImageUrl('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-previews'] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to create category');
    },
  });

  // Edit Category Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, name, imageUrl }: { id: string; name: string; imageUrl: string }) => {
      const token = await getToken();
      await apiClient.put(
        `/admin/categories/${id}`,
        { name, imageUrl: imageUrl.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setEditingId(null);
      setEditName('');
      setEditImageUrl('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-previews'] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to update category');
    },
  });

  // Delete Category Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      await apiClient.delete(`/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-previews'] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to delete category');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createMutation.mutate({ name: newCategoryName.trim(), imageUrl: newCategoryImageUrl });
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditImageUrl(cat.imageUrl || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateMutation.mutate({ id, name: editName.trim(), imageUrl: editImageUrl });
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-text-muted/15 pb-4">
        <div className="p-3 bg-primary-light text-primary rounded-2xl">
          <FolderTree className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-primary">
            Marketplace Category Management
          </h1>
          <p className="text-sm text-text-muted">
            Manage taxonomy categories and upload curated tile representative images for homepage grid display.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 bg-error-light border border-error/30 text-error rounded-2xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{formError}</p>
        </div>
      )}

      {/* Add New Category Form */}
      <form
        onSubmit={handleCreateSubmit}
        className="bg-background-card p-6 rounded-3xl border border-text-muted/15 shadow-soft space-y-4"
      >
        <h3 className="text-base font-bold font-heading text-text-primary flex items-center space-x-2">
          <Plus className="w-4 h-4 text-primary" />
          <span>Add New Category & Representative Image</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Category name (e.g. Handmade Pottery, Food & Spices)..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />

          <div className="flex items-center space-x-2">
            <input
              type="url"
              placeholder="Image URL (https://...)"
              value={newCategoryImageUrl}
              onChange={(e) => setNewCategoryImageUrl(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <label className="p-2.5 bg-background-muted border border-text-muted/20 rounded-xl hover:bg-primary-light transition-colors cursor-pointer text-text-muted hover:text-primary shrink-0" title="Upload Image File">
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
            </label>
          </div>
        </div>

        {newCategoryImageUrl && (
          <div className="flex items-center space-x-3 pt-1">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-text-muted/20 shrink-0">
              <img src={newCategoryImageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] text-text-muted">Image preview ready for tile display</span>
          </div>
        )}

        <button
          type="submit"
          disabled={createMutation.isPending || !newCategoryName.trim()}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-soft flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>Add Category</span>
        </button>
      </form>

      {/* Categories Table / List */}
      <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-4">
        <h2 className="font-heading font-bold text-lg text-text-primary border-b border-text-muted/10 pb-3">
          Existing Taxonomy Categories ({categories.length})
        </h2>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-text-muted text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p>Loading categories...</p>
          </div>
        ) : isError ? (
          <div className="p-4 bg-error-light border border-error/30 text-error rounded-xl text-sm font-bold">
            {(error as any)?.response?.data?.error?.message || 'Failed to load categories'}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-muted">
            No categories created yet. Add one above!
          </div>
        ) : (
          <div className="divide-y divide-text-muted/10">
            {categories.map((cat) => (
              <div key={cat.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {editingId === cat.id ? (
                  <div className="flex-1 w-full space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-3 py-2 bg-background-muted border border-primary rounded-xl text-sm focus:outline-none"
                        placeholder="Category Name"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={editImageUrl}
                          onChange={(e) => setEditImageUrl(e.target.value)}
                          className="flex-1 px-3 py-2 bg-background-muted border border-primary rounded-xl text-sm focus:outline-none"
                          placeholder="Image URL"
                        />
                        <label className="p-2 bg-background-muted border border-text-muted/20 rounded-xl hover:bg-primary-light cursor-pointer">
                          <Upload className="w-4 h-4 text-primary" />
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={updateMutation.isPending}
                        className="px-3 py-1.5 bg-success text-white text-sm font-bold rounded-xl hover:bg-success/90 cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 bg-background-muted text-text-muted text-sm font-semibold rounded-xl hover:text-text-primary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-background-muted border border-text-muted/15 shrink-0 flex items-center justify-center">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-text-muted" />
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-sm text-text-primary block">{cat.name}</span>
                        <span className="text-[11px] text-text-muted">
                          {cat.imageUrl ? 'Curated image set' : 'Branded fallback active'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light/50 rounded-xl transition-colors cursor-pointer"
                        title="Edit Category & Image"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
                            deleteMutation.mutate(cat.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-text-secondary hover:text-error hover:bg-error-light rounded-xl transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
