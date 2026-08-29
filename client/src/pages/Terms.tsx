/* TODO: Replace placeholder terms text with official Terms of Service legal document prior to launch */
import { FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3 border-b border-text-muted/15 pb-6">
        <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-semibold">
          <FileText className="w-4 h-4" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-primary">Terms of Service</h1>
        <p className="text-sm text-text-secondary">
          Sample Placeholder Agreement • Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="bg-background-card rounded-2xl p-6 md:p-8 border border-text-muted/15 shadow-soft space-y-6 text-xs text-text-secondary leading-relaxed">
        <div className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text-primary">1. Marketplace Platform Rules</h3>
          <p>
            By accessing EcoMarket, buyers agree to fair interaction rules, and sellers agree to fulfill genuine organic produce and authentic handcrafted goods as advertised.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text-primary">2. Intellectual Property & Courses</h3>
          <p>
            Course content, masterclass video materials, and platform branding remain the intellectual property of EcoMarket and accredited educators.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading font-bold text-base text-text-primary">3. Limitation of Liability</h3>
          <p>
            EcoMarket provides the platform seam on an "as-is" basis and acts as a verified marketplace facilitator connecting buyers and direct producers.
          </p>
        </div>
      </div>
    </div>
  );
}
