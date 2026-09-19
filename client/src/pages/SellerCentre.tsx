import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import {
  Package,
  IndianRupee,
  ShoppingBag,
  Truck,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Store,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import MyProducts from './MyProducts';
import SellerFulfillmentQueue from './SellerFulfillmentQueue';

interface SalesAnalytics {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  chartData: { label: string; revenue: number; orders: number }[];
}

interface SellerAlerts {
  lowStockProducts: { id: string; title: string; stock: number; lowStockThreshold: number; images: string[] }[];
  slaBreachedOrders: { orderId: string; status: string; createdAt: string; customerName?: string; productTitle?: string }[];
}

interface SellerProfile {
  id?: string;
  logoUrl?: string;
  bannerUrl?: string;
  bio?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: { instagram?: string; facebook?: string; twitter?: string };
  badges?: string[];
}

const AVAILABLE_BADGES = [
  'Verified Seller',
  'Fair Trade',
  'Organic Certified',
  'Zero Waste',
  'Locally Sourced',
  'Handcrafted',
  'Carbon Neutral Packaging',
];

export default function SellerCentre() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'fulfillment' | 'branding'>('overview');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // 1. Sales Analytics Query
  const { data: salesData, isLoading: loadingSales } = useQuery<{ success: boolean; data: SalesAnalytics }>({
    queryKey: ['seller-sales-analytics', period],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: SalesAnalytics }>(
        `/seller/analytics/sales?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  // 2. Actionable Alerts Query
  const { data: alertsData } = useQuery<{ success: boolean; data: SellerAlerts }>({
    queryKey: ['seller-alerts'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: SellerAlerts }>('/seller/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  // 3. Store Branding Profile Query
  const { data: profileData, isLoading: loadingProfile } = useQuery<{ success: boolean; data: SellerProfile }>({
    queryKey: ['seller-profile'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: SellerProfile }>('/seller/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  // Branding Profile Form State
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [socialInstagram, setSocialInstagram] = useState<string>('');
  const [socialFacebook, setSocialFacebook] = useState<string>('');
  const [badges, setBadges] = useState<string[]>([]);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Sync profile query data to local form state when tab opened
  const syncProfileState = () => {
    if (profileData?.data) {
      const p = profileData.data;
      setLogoUrl(p.logoUrl || '');
      setBannerUrl(p.bannerUrl || '');
      setBio(p.bio || '');
      setContactEmail(p.contactEmail || '');
      setContactPhone(p.contactPhone || '');
      setSocialInstagram(p.socialLinks?.instagram || '');
      setSocialFacebook(p.socialLinks?.facebook || '');
      setBadges(p.badges || ['Verified Seller']);
    }
  };

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await apiClient.put(
        '/seller/profile',
        {
          logoUrl,
          bannerUrl,
          bio,
          contactEmail,
          contactPhone,
          socialLinks: { instagram: socialInstagram, facebook: socialFacebook },
          badges,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setProfileSuccessMsg('Store branding profile saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    },
  });

  const analytics = salesData?.data || { period: 'daily', totalRevenue: 0, totalOrders: 0, chartData: [] };
  const alerts = alertsData?.data || { lowStockProducts: [], slaBreachedOrders: [] };

  const toggleBadge = (badge: string) => {
    setBadges((prev) => (prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]));
  };

  // Max value calculation for scaling SVG chart bars
  const maxRevenue = Math.max(...analytics.chartData.map((d) => d.revenue), 100);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Dashboard Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-text-muted/15 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary">Seller Centre Operations</h1>
          <p className="text-sm text-text-muted">
            Monitor sales trend charts, respond to inventory alerts, manage order dispatches, and brand your store.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-background-muted p-1 rounded-2xl border border-text-muted/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-primary text-white shadow-soft'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-primary text-white shadow-soft'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            My Products
          </button>
          <button
            onClick={() => setActiveTab('fulfillment')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'fulfillment'
                ? 'bg-primary text-white shadow-soft'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Fulfillment Queue
          </button>
          <button
            onClick={() => {
              setActiveTab('branding');
              syncProfileState();
            }}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
              activeTab === 'branding'
                ? 'bg-primary text-white shadow-soft'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Store Branding</span>
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Actionable Alerts Panel */}
          {(alerts.lowStockProducts.length > 0 || alerts.slaBreachedOrders.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Low Stock Warning */}
              {alerts.lowStockProducts.length > 0 && (
                <div className="bg-secondary/15 border border-accent/40 rounded-3xl p-5 shadow-soft space-y-3">
                  <div className="flex items-center space-x-2 text-text-primary font-bold text-sm uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-secondary shrink-0" />
                    <span>Low Stock Alert ({alerts.lowStockProducts.length} items)</span>
                  </div>
                  <div className="space-y-2">
                    {alerts.lowStockProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-background-card p-3 rounded-2xl border border-text-muted/15 flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={prod.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e'}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-bold text-text-primary line-clamp-1">{prod.title}</p>
                            <p className="text-[11px] text-text-muted">
                              Stock: <strong className="text-error font-extrabold">{prod.stock}</strong> (Limit: {prod.lowStockThreshold})
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('products')}
                          className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-hover cursor-pointer"
                        >
                          Restock
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLA Breached Orders Warning */}
              {alerts.slaBreachedOrders.length > 0 && (
                <div className="bg-error-light/60 border border-error/30 rounded-3xl p-5 shadow-soft space-y-3">
                  <div className="flex items-center space-x-2 text-error font-bold text-sm uppercase tracking-wider">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Dispatch SLA Warning (&gt;48h Pending)</span>
                  </div>
                  <div className="space-y-2">
                    {alerts.slaBreachedOrders.map((ord) => (
                      <div
                        key={ord.orderId}
                        className="bg-background-card p-3 rounded-2xl border border-text-muted/15 flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="font-bold font-mono text-primary">Order #{ord.orderId.slice(0, 8)}</p>
                          <p className="text-[11px] text-text-muted">
                            Placed: {new Date(ord.createdAt).toLocaleDateString()} • Status: {ord.status}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('fulfillment')}
                          className="px-3 py-1 bg-error text-white text-[10px] font-bold rounded-lg hover:bg-error/90 cursor-pointer"
                        >
                          Fulfill Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-text-muted uppercase tracking-wider block">
                  Gross Seller Sales
                </span>
                <span className="text-3xl font-extrabold font-heading text-primary block">
                  ₹{analytics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="inline-flex items-center text-[11px] text-success font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  Verified paid order revenue
                </span>
              </div>
              <div className="p-4 bg-primary-light text-primary rounded-2xl">
                <IndianRupee className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-text-muted uppercase tracking-wider block">
                  Total Orders Processed
                </span>
                <span className="text-3xl font-extrabold font-heading text-secondary block">
                  {analytics.totalOrders}
                </span>
                <span className="text-[11px] text-text-muted">Customer order dispatches</span>
              </div>
              <div className="p-4 bg-secondary-light text-secondary rounded-2xl">
                <Truck className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-text-muted uppercase tracking-wider block">
                  Store Status
                </span>
                <span className="text-xl font-extrabold font-heading text-text-primary block flex items-center space-x-1">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span>Active Seller</span>
                </span>
                <span className="text-[11px] text-text-muted">Operational marketplace store</span>
              </div>
              <div className="p-4 bg-background-muted text-primary rounded-2xl border border-text-muted/10">
                <Store className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Interactive Sales Trend Chart */}
          <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/10 pb-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-text-primary flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Sales Trend & Revenue Performance</span>
                </h3>
                <p className="text-sm text-text-muted">
                  Aggregated gross sales grouped by {period} period
                </p>
              </div>

              {/* Timeframe Toggle Buttons */}
              <div className="flex items-center space-x-1 bg-background-muted/80 p-1 rounded-xl border border-text-muted/15 shrink-0">
                <button
                  onClick={() => setPeriod('daily')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    period === 'daily' ? 'bg-primary text-white shadow-soft' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setPeriod('weekly')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    period === 'weekly' ? 'bg-primary text-white shadow-soft' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setPeriod('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    period === 'monthly' ? 'bg-primary text-white shadow-soft' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {loadingSales ? (
              <div className="py-12 flex justify-center text-text-muted">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : analytics.chartData.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-muted">
                No sales recorded for the selected period yet.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Bar Chart */}
                <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-background-muted/30 rounded-2xl border border-text-muted/10 overflow-x-auto no-scrollbar">
                  {analytics.chartData.map((dp, i) => {
                    const heightPercent = Math.max(10, Math.round((dp.revenue / maxRevenue) * 100));
                    return (
                      <div key={i} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 group h-full justify-end">
                        <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          ₹{dp.revenue}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-primary/80 group-hover:bg-primary rounded-t-xl transition-all shadow-soft relative"
                        ></div>
                        <span className="text-[10px] text-text-muted font-mono truncate max-w-[50px]">{dp.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4">
          <MyProducts />
        </div>
      )}

      {activeTab === 'fulfillment' && (
        <div className="space-y-4">
          <SellerFulfillmentQueue />
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="bg-background-card rounded-3xl p-8 border border-text-muted/15 shadow-soft space-y-8">
          <div className="flex items-center justify-between border-b border-text-muted/15 pb-4">
            <div>
              <h2 className="text-2xl font-bold font-heading text-primary flex items-center space-x-2">
                <Store className="w-6 h-6 text-primary" />
                <span>Store Branding & Public Info</span>
              </h2>
              <p className="text-sm text-text-muted">
                Configure your public storefront branding banner, bio, contact channels, and self-declared trust badges.
              </p>
            </div>

            <button
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
              className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-soft flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Branding Profile</span>
            </button>
          </div>

          {profileSuccessMsg && (
            <div className="p-4 bg-success-light border border-success/30 text-success rounded-2xl text-sm font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {loadingProfile ? (
            <div className="py-8 flex justify-center text-text-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block font-bold text-text-primary">Store Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/logo.jpg"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-text-primary">Store Banner URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/banner.jpg"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-text-primary">Store Bio & Heritage Story</label>
                <textarea
                  rows={3}
                  placeholder="Share your brand story, sourcing principles, and commitment to sustainable quality..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block font-bold text-text-primary">Contact Email</label>
                  <input
                    type="email"
                    placeholder="support@yourbrand.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-text-primary">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Badges Checklist */}
              <div className="space-y-3 border-t border-text-muted/10 pt-4">
                <label className="block font-bold text-text-primary flex items-center space-x-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Self-Declared Store Badges</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_BADGES.map((b) => {
                    const active = badges.includes(b);
                    return (
                      <button
                        type="button"
                        key={b}
                        onClick={() => toggleBadge(b)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-primary text-white shadow-soft'
                            : 'bg-background-muted text-text-secondary border border-text-muted/20 hover:border-primary'
                        }`}
                      >
                        {b} {active && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
