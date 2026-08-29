import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Users, Search, RefreshCw, AlertCircle, Ban, CheckCircle2, ShieldAlert } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  _count?: {
    orders: number;
  };
}

export default function AdminUsers() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  // Fetch Users Query
  const { data, isLoading, isError, error } = useQuery<{
    success: boolean;
    data: { items: UserItem[]; total: number; page: number; totalPages: number };
  }>({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{
        success: boolean;
        data: { items: UserItem[]; total: number; page: number; totalPages: number };
      }>(`/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  // Toggle Block Status Mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, isBlocked }: { id: string; isBlocked: boolean }) => {
      const token = await getToken();
      await apiClient.patch(
        `/admin/users/${id}/block`,
        { isBlocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const users = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-text-muted/15 pb-4">
        <div className="p-3 bg-ai-light text-ai rounded-2xl">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-primary">
            Customer & User Management
          </h1>
          <p className="text-xs text-text-muted">
            Monitor registered platform users, view order activity, and enforce server-side account suspension.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-background-card p-6 rounded-3xl border border-text-muted/15 shadow-soft">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search user by name or email address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-soft cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-text-muted/10 pb-3">
          <h2 className="font-heading font-bold text-lg text-text-primary">
            Registered Users ({data?.data?.total || 0})
          </h2>
          <span className="text-xs text-text-muted">Page {page} of {totalPages}</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-text-muted text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p>Loading users...</p>
          </div>
        ) : isError ? (
          <div className="p-4 bg-error-light border border-error/30 text-error rounded-xl text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{(error as any)?.response?.data?.error?.message || 'Failed to load user list'}</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            No registered users found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-background-muted/60 text-text-muted uppercase tracking-wider border-b border-text-muted/10 font-bold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Account Access Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-muted/10 font-medium text-text-primary">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-background-muted/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold block">{usr.name}</span>
                        <span className="text-[11px] text-text-muted">{usr.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-light text-primary border border-primary/20">
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary">
                      {new Date(usr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-secondary">
                      {usr._count?.orders || 0} orders
                    </td>
                    <td className="py-3.5 px-4">
                      {usr.isBlocked ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-error-light text-error border border-error/30">
                          <Ban className="w-3 h-3" />
                          <span>Blocked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-light text-success border border-success/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {usr.role === 'ADMIN' ? (
                        <span className="text-[10px] text-text-muted italic">Protected Admin</span>
                      ) : (
                        <button
                          onClick={() => toggleBlockMutation.mutate({ id: usr.id, isBlocked: !usr.isBlocked })}
                          disabled={toggleBlockMutation.isPending}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50 ${
                            usr.isBlocked
                              ? 'bg-success text-white hover:bg-success/90'
                              : 'bg-error-light text-error border border-error/30 hover:bg-error hover:text-white'
                          }`}
                        >
                          {usr.isBlocked ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Unblock User</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Block User</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-text-muted/10 text-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-background-muted text-text-primary rounded-xl disabled:opacity-40 cursor-pointer font-bold"
            >
              Previous
            </button>
            <span className="text-text-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-background-muted text-text-primary rounded-xl disabled:opacity-40 cursor-pointer font-bold"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
