import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Sprout, MapPin, ArrowLeft, RefreshCw, AlertCircle, Award, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface Producer {
  id: string;
  name: string;
  location: string;
  story?: string;
  practices?: string;
  photos: string[];
  user?: {
    name: string;
    email: string;
  };
  products: any[];
}

export default function ProducerDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Producer }>({
    queryKey: ['producer', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Producer }>(`/producers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const producer = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-base font-medium">Loading producer story & profile...</p>
      </div>
    );
  }

  if (isError || !producer) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-error-light border border-error/30 rounded-2xl p-8 space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-error" />
          <h2 className="text-2xl font-bold text-error font-heading">Producer Profile Not Found</h2>
          <p className="text-sm text-error/90 max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message || 'The requested producer profile does not exist.'}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Back Button */}
      <Link
        to="/shop"
        className="inline-flex items-center space-x-2 text-base font-medium text-text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </Link>

      {/* Hero Banner Header */}
      <div className="relative bg-gradient-to-br from-[#1B2E1E] to-primary text-white rounded-3xl p-8 md:p-12 shadow-card overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-sm font-semibold border border-white/20">
            <Sprout className="w-4 h-4 text-secondary" />
            <span>Verified Organic Producer</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold font-heading tracking-tight">
            {producer.name}
          </h1>

          <div className="flex items-center space-x-4 text-sm font-medium text-white/90">
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-secondary" />
              {producer.location}
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Award className="w-4 h-4 mr-1 text-secondary" />
              {producer.products?.length || 0} Direct Sustainable Offerings
            </span>
          </div>
        </div>
      </div>

      {/* Story & Farming Practices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Story & Practices */}
        <div className="lg:col-span-2 space-y-8">
          {/* Producer Story */}
          {producer.story && (
            <div className="bg-background-card rounded-3xl p-6 md:p-8 border border-text-muted/15 shadow-soft space-y-4">
              <h2 className="text-xl font-bold font-heading text-text-primary border-b border-text-muted/10 pb-3">
                Our Story & Origins
              </h2>
              <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line">
                {producer.story}
              </p>
            </div>
          )}

          {/* Farming Practices */}
          {producer.practices && (
            <div className="bg-background-card rounded-3xl p-6 md:p-8 border border-text-muted/15 shadow-soft space-y-4">
              <div className="flex items-center space-x-2 text-primary border-b border-text-muted/10 pb-3">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="text-xl font-bold font-heading text-text-primary">
                  Sustainable Practices & Methods
                </h2>
              </div>
              <p className="text-base text-text-secondary leading-relaxed whitespace-pre-line">
                {producer.practices}
              </p>
            </div>
          )}

          {/* Photo Gallery */}
          {producer.photos && producer.photos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-heading text-text-primary flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <span>Farm & Craft Gallery</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {producer.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-2xl overflow-hidden bg-background-muted border border-text-muted/10 shadow-sm hover:scale-105 transition-transform"
                  >
                    <img src={photo} alt={`Farm photo ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Impact Highlights */}
        <div className="space-y-6">
          <div className="bg-secondary-light/50 border border-secondary/30 rounded-3xl p-6 space-y-4">
            <h3 className="font-heading font-bold text-base text-secondary flex items-center space-x-2">
              <Sprout className="w-5 h-5 text-secondary" />
              <span>Direct Producer Impact</span>
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              When you purchase directly from <strong>{producer.name}</strong>, 100% of fair-trade earnings support local community farming, soil rejuvenation, and zero-chemical harvesting.
            </p>
          </div>
        </div>
      </div>

      {/* Linked Products Grid */}
      <div className="space-y-6 pt-6 border-t border-text-muted/15">
        <div>
          <h2 className="text-2xl font-bold font-heading text-text-primary">
            Products by {producer.name}
          </h2>
          <p className="text-sm text-text-muted">
            Direct farm-fresh & artisanal goods harvested locally
          </p>
        </div>

        {producer.products && producer.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {producer.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-background-card rounded-2xl p-8 text-center text-sm text-text-muted border border-text-muted/15">
            No products currently listed by this producer.
          </div>
        )}
      </div>
    </div>
  );
}
