/* TODO: Replace placeholder privacy text with legally audited privacy policy prior to go-live */
import { Shield } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3 border-b border-text-muted/15 pb-6">
        <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-semibold">
          <Shield className="w-4 h-4" />
          <span>Data Protection</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-primary">Privacy Policy</h1>
        <p className="text-sm text-text-secondary">
          Sample Placeholder Terms • Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="bg-background-card rounded-2xl p-6 md:p-8 border border-text-muted/15 shadow-soft space-y-6 text-xs text-text-secondary leading-relaxed">
        <div className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text-primary">1. Information Collection</h3>
          <p>
            We collect personal information necessary for order fulfillment, account authentication, and course progression tracking. Personal credentials are securely managed via Clerk authentication.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text-primary">2. Use of Personal Data</h3>
          <p>
            Your data is used strictly to process marketplace transactions, manage course enrollments, and improve personalized recommendations via our grounded AI Assistant.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text-primary">3. Data Sharing</h3>
          <p>
            We do not sell user data to third parties. Delivery addresses are shared solely with verified sellers and logistics partners for product dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}
