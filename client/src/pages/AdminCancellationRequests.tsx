import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function AdminCancellationRequests() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminCancellationRequests', page],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get('/admin/cancellation-requests', {
        params: { page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      await apiClient.patch(`/admin/orders/${id}/approve-cancellation`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCancellationRequests'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      await apiClient.patch(`/admin/orders/${id}/reject-cancellation`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCancellationRequests'] }),
  });

  const requests = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center space-x-3 border-b border-text-muted/15 pb-5">
        <div className="p-3 bg-error/10 text-error rounded-2xl">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary">Cancellation Requests</h1>
          <p className="text-sm text-text-secondary">
            Review and approve or reject order cancellation requests from sellers.
          </p>
        </div>
      </div>

      <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <p className="text-sm font-medium">Loading requests...</p>
          </div>
        ) : isError ? (
          <p className="text-error text-base text-center py-8">Failed to load requests.</p>
        ) : requests.length === 0 ? (
          <p className="text-text-muted text-base text-center py-12">No pending cancellation requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-text-muted/15 text-sm text-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Order ID & Date</th>
                  <th className="py-3 px-4 font-semibold">Seller</th>
                  <th className="py-3 px-4 font-semibold">Reason</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-muted/10 text-sm">
                {requests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-background-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold block">#{req.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-text-muted">{new Date(req.createdAt).toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      {req.items?.[0]?.product?.seller?.name || 'Seller'}
                    </td>
                    <td className="py-3 px-4 text-text-secondary italic max-w-xs truncate">
                      "{req.cancellationRequestReason || 'No reason provided'}"
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          if (window.confirm('Approve this cancellation request?')) {
                            approveMutation.mutate(req.id);
                          }
                        }}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="px-3 py-1.5 bg-error text-white font-semibold text-sm rounded-lg hover:bg-error/90 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Approve Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Reject this cancellation request?')) {
                            rejectMutation.mutate(req.id);
                          }
                        }}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="px-3 py-1.5 border border-text-muted/20 hover:bg-background-muted text-text-secondary text-[11px] font-bold rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
