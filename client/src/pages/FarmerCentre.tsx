import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Sprout, PlusCircle, Package, IndianRupee, Truck } from 'lucide-react';

interface AnalyticsData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function FarmerCentre() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  const { data, isLoading } = useQuery<{ success: boolean; data: AnalyticsData }>({
    queryKey: ['seller-analytics'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: AnalyticsData }>('/seller/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const analytics = data?.data || { totalProducts: 0, totalOrders: 0, totalRevenue: 0 };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Friendly Farmer Header */}
      <div className="bg-gradient-to-br from-[#1B2E1E] to-primary text-white rounded-3xl p-8 md:p-12 shadow-card space-y-4 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/20">
            <Sprout className="w-4 h-4 text-secondary" />
            <span>Organic Farmer Portal</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold font-heading tracking-tight">
            Kisan & Farmer Centre
          </h1>

          <p className="text-sm md:text-base text-white/90 leading-relaxed">
            Simplified tool for local farmers to list fresh harvests, track customer orders, and receive fair market payments directly!
          </p>
        </div>

        <Link
          to="/seller/products/new"
          className="px-6 py-4 bg-secondary text-text-primary text-base font-bold rounded-2xl hover:bg-secondary-hover transition-colors shadow-soft flex items-center justify-center space-x-2 shrink-0"
        >
          <PlusCircle className="w-6 h-6" />
          <span>Add New Harvest</span>
        </Link>
      </div>

      {/* Large Touch Target Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Revenue */}
        <div className="bg-background-card border-2 border-secondary/20 rounded-3xl p-8 shadow-soft space-y-3">
          <div className="p-4 bg-secondary-light text-secondary rounded-2xl w-fit">
            <IndianRupee className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
              Total Farm Revenue
            </span>
            <span className="text-3xl font-black font-heading text-secondary">
              ₹{analytics.totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Card 2: Active Products */}
        <div className="bg-background-card border-2 border-primary/20 rounded-3xl p-8 shadow-soft space-y-3">
          <div className="p-4 bg-primary-light text-primary rounded-2xl w-fit">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
              Harvest Produce Listed
            </span>
            <span className="text-3xl font-black font-heading text-primary">
              {analytics.totalProducts} Items
            </span>
          </div>
        </div>

        {/* Card 3: Total Orders */}
        <div className="bg-background-card border-2 border-text-muted/20 rounded-3xl p-8 shadow-soft space-y-3">
          <div className="p-4 bg-background-muted text-text-primary rounded-2xl w-fit border">
            <Truck className="w-8 h-8 text-secondary" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
              Orders Received
            </span>
            <span className="text-3xl font-black font-heading text-text-primary">
              {analytics.totalOrders} Orders
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          to="/seller/products"
          className="p-6 bg-background-card rounded-2xl border border-text-muted/15 hover:border-secondary transition-all shadow-soft flex items-center justify-between group"
        >
          <div>
            <h3 className="font-heading font-bold text-base text-text-primary group-hover:text-secondary">
              Manage My Products
            </h3>
            <p className="text-xs text-text-muted">Edit prices, quantities, and sustainability tags</p>
          </div>
          <Package className="w-6 h-6 text-secondary" />
        </Link>

        <Link
          to="/seller-centre/orders"
          className="p-6 bg-background-card rounded-2xl border border-text-muted/15 hover:border-secondary transition-all shadow-soft flex items-center justify-between group"
        >
          <div>
            <h3 className="font-heading font-bold text-base text-text-primary group-hover:text-secondary">
              Fulfillment Queue
            </h3>
            <p className="text-xs text-text-muted">Pack and mark items as shipped to customers</p>
          </div>
          <Truck className="w-6 h-6 text-secondary" />
        </Link>
      </div>
    </div>
  );
}
