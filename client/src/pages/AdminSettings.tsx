import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import {
  Settings,
  Store,
  Mail,
  IndianRupee,
  Truck,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function AdminSettings() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [storeName, setStoreName] = useState('EcoMarket');
  const [contactEmail, setContactEmail] = useState('support@ecomarket.com');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [flatShippingFee, setFlatShippingFee] = useState<number | string>(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch site settings
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get('/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
    enabled: !!isSignedIn,
  });

  useEffect(() => {
    if (data) {
      if (data.storeName) setStoreName(data.storeName);
      if (data.contactEmail) setContactEmail(data.contactEmail);
      if (data.currencySymbol) setCurrencySymbol(data.currencySymbol);
      if (data.flatShippingFee !== undefined) setFlatShippingFee(Number(data.flatShippingFee));
    }
  }, [data]);

  // Update site settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = await getToken();
      const res = await apiClient.put('/admin/settings', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (resData) => {
      setSuccessMsg(resData?.message || 'Site settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      setTimeout(() => setSuccessMsg(null), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    updateSettingsMutation.mutate({
      storeName,
      contactEmail,
      currencySymbol,
      flatShippingFee: Number(flatShippingFee) || 0,
    });
  };

  const errorMessage =
    (error as any)?.response?.data?.error?.message ||
    (error as any)?.message ||
    'Failed to load site settings';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-text-muted/15 pb-5">
        <div className="p-3 bg-accent/20 text-[#1B2E1E] rounded-2xl">
          <Settings className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary">Platform Site Settings</h1>
          <p className="text-xs text-text-secondary">
            Configure global store identity, customer contact email, currency display, and flat shipping fee.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-success-light text-success border border-success/30 rounded-2xl p-4 flex items-center space-x-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-text-secondary space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium">Loading platform site settings...</p>
        </div>
      ) : isError ? (
        <div className="bg-error-light border border-error/30 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-error" />
          <p className="text-sm font-bold text-error">Failed to load site settings</p>
          <p className="text-xs text-error/80 font-mono max-w-md mx-auto">{errorMessage}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-error text-white text-xs font-semibold rounded-lg hover:bg-error/90 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-background-card rounded-3xl p-6 sm:p-8 border border-text-muted/15 shadow-soft space-y-6">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary border-b border-text-muted/15 pb-3">
              General Identity & Commerce Configurations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Store Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary flex items-center space-x-1.5">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span>Platform Store Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                />
              </div>

              {/* Contact Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Customer Support Contact Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                />
              </div>

              {/* Currency Symbol */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary flex items-center space-x-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-primary" />
                  <span>Display Currency Symbol</span>
                </label>
                <input
                  type="text"
                  required
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                />
              </div>

              {/* Flat Shipping Fee */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary flex items-center space-x-1.5">
                  <Truck className="w-3.5 h-3.5 text-secondary" />
                  <span>Flat Shipping Fee (₹)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={flatShippingFee}
                  onChange={(e) => setFlatShippingFee(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                />
                <p className="text-[11px] text-text-muted">
                  Wired into live checkout shipping calculation (overrides standard ₹70 fee when set &gt; 0).
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t border-text-muted/15 pt-5 flex items-center justify-end">
            <button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="px-6 py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-soft flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {updateSettingsMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Site Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
