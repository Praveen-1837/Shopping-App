import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { FolderTree, Plus, Edit2, Trash2, Check, X, RefreshCw, AlertCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export default function AdminCategories() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
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

  // Create Category Mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = await getToken();
      await apiClient.post(
        '/admin/categories',
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setNewCategoryName('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to create category');
    },
  });

  // Edit Category Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const token = await getToken();
      await apiClient.put(
        `/admin/categories/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setEditingId(null);
      setEditName('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
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
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to delete category');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createMutation.mutate(newCategoryName.trim());
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateMutation.mutate({ id, name: editName.trim() });
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
          <p className="text-xs text-text-muted">
            Add, rename, or delete standardized taxonomy categories for products and courses.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 bg-error-light border border-error/30 text-error rounded-2xl flex items-center space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{formError}</p>
        </div>
      )}

      {/* Add New Category Card */}
      <form
        onSubmit={handleCreateSubmit}
        className="bg-background-card p-6 rounded-3xl border border-text-muted/15 shadow-soft flex flex-col sm:flex-row items-center gap-4"
      >
        <input
          type="text"
          placeholder="Enter new category name (e.g. Handmade Pottery, Organic Tea)..."
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-1 w-full px-4 py-3 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !newCategoryName.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-soft flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
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
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-text-muted text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p>Loading categories...</p>
          </div>
        ) : isError ? (
          <div className="p-4 bg-error-light border border-error/30 text-error rounded-xl text-xs font-bold">
            {(error as any)?.response?.data?.error?.message || 'Failed to load categories'}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            No formal categories created yet. Add one above!
          </div>
        ) : (
          <div className="divide-y divide-text-muted/10">
            {categories.map((cat) => (
              <div key={cat.id} className="py-3 flex items-center justify-between gap-4">
                {editingId === cat.id ? (
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-background-muted border border-primary rounded-lg text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEdit(cat.id)}
                      disabled={updateMutation.isPending}
                      className="p-1.5 bg-success text-white rounded-lg hover:bg-success/90 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 bg-background-muted text-text-muted rounded-lg hover:text-text-primary cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="font-bold text-xs text-text-primary">{cat.name}</span>
                      <span className="text-[10px] text-text-muted block">
                        Added on {new Date(cat.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light/50 rounded-lg transition-colors cursor-pointer"
                        title="Rename Category"
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
                        className="p-2 text-text-secondary hover:text-error hover:bg-error-light rounded-lg transition-colors cursor-pointer"
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
