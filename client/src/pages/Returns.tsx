/* TODO: Replace sample return policy content with finalized legal return terms before launch */
import { RefreshCw, ShieldCheck, Truck } from 'lucide-react';

export default function Returns() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3 border-b border-text-muted/15 pb-6">
        <div className="inline-flex items-center space-x-2 bg-secondary-light text-secondary px-3 py-1 rounded-full text-sm font-semibold">
          <RefreshCw className="w-4 h-4" />
          <span>Guarantee & Exchanges</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-primary">Returns & Refund Policy</h1>
        <p className="text-base text-text-secondary">
          Sample Policy Overview • Flagged for final review
        </p>
      </div>

      <div className="bg-background-card rounded-2xl p-6 md:p-8 border border-text-muted/15 shadow-soft space-y-6 text-sm text-text-secondary leading-relaxed">
        <div className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text-primary">1. Perishable Organic Produce</h3>
          <p>
            Due to the fresh nature of organic fruits, vegetables, and seeds, returns are eligible only if items arrive damaged or defective. Claims must be submitted within 24 hours of delivery.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text-primary">2. Artisan Crafts & Non-Perishable Eco Goods</h3>
          <p>
            Non-perishable eco products and artisan crafts carry a 7-day hassle-free replacement or return window if unopened in original packaging.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text-primary">3. Masterclass Courses</h3>
          <p>
            Digital masterclass enrollments are non-refundable once course video modules have been accessed or completed.
          </p>
        </div>
      </div>
    </div>
  );
}
