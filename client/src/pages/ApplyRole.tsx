import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Sprout, ShoppingBag, BookOpen, Send, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ApplyRole() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  const [requestedRole, setRequestedRole] = useState<'SELLER' | 'FARMER' | 'ARTISAN' | 'EDUCATOR'>('FARMER');
  const [businessName, setBusinessName] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        navigate('/login');
        return;
      }
      const token = await getToken();
      await apiClient.post(
        '/onboarding/apply',
        {
          requestedRole,
          details: {
            businessName,
            experience,
            reason,
            phone,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-success-light border border-success/30 rounded-3xl p-8 space-y-4 shadow-soft">
          <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
          <h2 className="text-2xl font-bold font-heading text-success">Application Submitted!</h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Your application to become a verified <strong>{requestedRole}</strong> has been received. Our team will review your application shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs text-text-muted hover:text-primary transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold font-heading text-primary">Apply for Partner Role</h1>
        <p className="text-xs text-text-muted">
          Join our eco-marketplace ecosystem as a verified Farmer, Seller, Artisan, or Educator.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyMutation.mutate();
        }}
        className="bg-background-card rounded-3xl p-6 md:p-8 border border-text-muted/15 shadow-soft space-y-6"
      >
        {applyMutation.isError && (
          <div className="p-4 bg-error-light border border-error/30 text-error text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{(applyMutation.error as any)?.response?.data?.error?.message || 'Failed to submit application'}</span>
          </div>
        )}

        {/* Role Choice Cards */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
            Select Desired Partner Role *
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { role: 'FARMER', label: 'Farmer', icon: Sprout, desc: 'Organic produce' },
              { role: 'SELLER', label: 'Eco Seller', icon: ShoppingBag, desc: 'Sustainable goods' },
              { role: 'ARTISAN', label: 'Handicrafts', icon: Sprout, desc: 'Handmade items' },
              { role: 'EDUCATOR', label: 'Educator', icon: BookOpen, desc: 'Masterclasses' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = requestedRole === item.role;
              return (
                <button
                  type="button"
                  key={item.role}
                  onClick={() => setRequestedRole(item.role as any)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-primary-light text-primary ring-2 ring-primary/20'
                      : 'border-text-muted/20 bg-background-card text-text-secondary hover:border-text-muted'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <div>
                    <span className="block font-heading font-bold text-sm">{item.label}</span>
                    <span className="block text-[10px] text-text-muted">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Business / Farm Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary">
            Business / Farm / Brand Name *
          </label>
          <input
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Green Valley Organic Farms"
            className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Contact Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary">
            Contact Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Experience & Background */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary">
            Years of Experience & Farming / Crafting Practices
          </label>
          <textarea
            rows={3}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Describe your organic certification, years of experience, zero-chemical harvesting, or teaching history..."
            className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Reason for Application */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary">
            Why would you like to join EcoMarket?
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Share your eco-mission..."
            className="w-full px-4 py-3 text-xs bg-background-muted border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button
          type="submit"
          disabled={applyMutation.isPending}
          className="w-full py-3.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-soft flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          {applyMutation.isPending ? (
            'Submitting...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Partner Application</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
