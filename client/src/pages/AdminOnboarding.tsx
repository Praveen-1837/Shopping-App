import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { ShieldCheck, CheckCircle2, XCircle, RefreshCw, AlertCircle, Clock, Briefcase, Sprout, Award } from 'lucide-react';

interface Application {
  id: string;
  userId: string;
  requestedRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  details?: {
    businessName?: string;
    experience?: string;
    reason?: string;
    phone?: string;
    fullName?: string;
    vehicleType?: string;
    serviceArea?: string;
    availability?: string;
  };
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminOnboarding() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'SELLER' | 'FARMER' | 'EDUCATOR' | 'DELIVERY_PARTNER') || 'SELLER';
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: { items: Application[] } }>({
    queryKey: ['admin-onboarding', activeTab],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: { items: Application[] } }>(
        `/admin/onboarding?requestedRole=${activeTab}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
      const token = await getToken();
      await apiClient.patch(
        `/admin/onboarding/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const applications = data?.data?.items || [];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-text-muted/15 pb-4">
        <div className="p-3 bg-ai-light text-ai rounded-2xl">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading text-text-primary">
            Partner Application Approvals
          </h1>
          <p className="text-xs text-text-muted">
            Review applicant credentials and grant operational access for Sellers, Farmers, and Educators.
          </p>
        </div>
      </div>

      {/* 3 Separated View Tabs */}
      <div className="flex items-center space-x-3 border-b border-text-muted/20 pb-1">
        <button
          onClick={() => setSearchParams({ tab: 'SELLER' })}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'SELLER'
              ? 'bg-primary text-white shadow-soft'
              : 'bg-background-card text-text-secondary border border-text-muted/20 hover:border-primary'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Seller Approvals</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'FARMER' })}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'FARMER'
              ? 'bg-secondary text-white shadow-soft'
              : 'bg-background-card text-text-secondary border border-text-muted/20 hover:border-secondary'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Farmer Approvals</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'EDUCATOR' })}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'EDUCATOR'
              ? 'bg-accent text-text-primary shadow-soft font-extrabold'
              : 'bg-background-card text-text-secondary border border-text-muted/20 hover:border-accent'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Educator Approvals</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'DELIVERY_PARTNER' })}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'DELIVERY_PARTNER'
              ? 'bg-primary-dark text-white shadow-soft'
              : 'bg-background-card text-text-secondary border border-text-muted/20 hover:border-primary-dark'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Delivery Approvals</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-text-muted">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs">Loading {activeTab.toLowerCase()} applications...</p>
        </div>
      ) : isError ? (
        <div className="p-6 bg-error-light border border-error/30 text-error rounded-2xl flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-xs font-bold">{(error as any)?.response?.data?.error?.message || 'Access Denied'}</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-background-card rounded-3xl p-12 text-center text-xs text-text-muted border border-text-muted/15 space-y-2">
          <Clock className="w-8 h-8 mx-auto text-text-muted opacity-50" />
          <p className="font-bold text-sm text-text-primary">No Pending {activeTab} Applications</p>
          <p>Applications requesting {activeTab} role access will appear here for admin review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-heading font-bold text-base text-text-primary">
                    {app.user?.name}
                  </span>
                  <span className="text-xs text-text-muted">({app.user?.email})</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      app.status === 'APPROVED'
                        ? 'bg-success-light text-success border border-success/30'
                        : app.status === 'REJECTED'
                        ? 'bg-error-light text-error border border-error/30'
                        : 'bg-accent/20 text-text-primary border border-accent/40'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs font-medium text-text-secondary">
                  <span>
                    Requested Role: <strong className="text-primary font-bold">{app.requestedRole}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Submitted: {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Details Breakdown */}
                {app.details && (
                  <div className="bg-background-muted/60 rounded-2xl p-4 border border-text-muted/10 space-y-1.5 text-xs text-text-secondary">
                    {app.details.businessName && (
                      <p>
                        <strong>Business / Farm / Institute:</strong> {app.details.businessName}
                      </p>
                    )}
                    {app.details.fullName && (
                      <p>
                        <strong>Full Name:</strong> {app.details.fullName}
                      </p>
                    )}
                    {app.details.phone && (
                      <p>
                        <strong>Phone Contact:</strong> {app.details.phone}
                      </p>
                    )}
                    {app.details.vehicleType && (
                      <p>
                        <strong>Vehicle Type:</strong> {app.details.vehicleType}
                      </p>
                    )}
                    {app.details.serviceArea && (
                      <p>
                        <strong>Service Area:</strong> {app.details.serviceArea}
                      </p>
                    )}
                    {app.details.availability && (
                      <p>
                        <strong>Availability:</strong> {app.details.availability}
                      </p>
                    )}
                    {app.details.experience && (
                      <p>
                        <strong>Experience / Methods:</strong> {app.details.experience}
                      </p>
                    )}
                    {app.details.reason && (
                      <p>
                        <strong>Statement of Intent:</strong> {app.details.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {app.status === 'PENDING' ? (
                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => reviewMutation.mutate({ id: app.id, status: 'APPROVED' })}
                    disabled={reviewMutation.isPending}
                    className="px-4 py-2.5 bg-success text-white text-xs font-bold rounded-xl hover:bg-success/90 transition-colors shadow-soft flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => reviewMutation.mutate({ id: app.id, status: 'REJECTED' })}
                    disabled={reviewMutation.isPending}
                    className="px-4 py-2.5 bg-error-light text-error border border-error/30 hover:bg-error hover:text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs text-text-muted font-mono italic">Decision Finalized</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
