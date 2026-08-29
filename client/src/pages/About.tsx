/* TODO: Replace placeholder company story & team content with real brand content before launch */
import { Sprout, Target, ShieldCheck, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Sprout className="w-4 h-4" />
          <span>Our Mission</span>
        </div>
        <h1 className="text-4xl font-extrabold font-heading text-primary">About EcoMarket</h1>
        <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
          We connect conscious consumers directly with eco-farmers, local artisans, and sustainability educators across India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-3">
          <div className="p-3 bg-primary-light text-primary rounded-xl w-fit">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg">Direct Sourcing</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Eliminating middlemen to ensure 100% fair pay for organic producers and authentic farm-fresh goods for buyers.
          </p>
        </div>

        <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-3">
          <div className="p-3 bg-secondary-light text-secondary rounded-xl w-fit">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg">Verified Integrity</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Every seller and farmer undergoes rigorous eco-practice validation before listing products on our marketplace.
          </p>
        </div>

        <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-3">
          <div className="p-3 bg-accent/20 text-text-primary rounded-xl w-fit">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-lg">Community Education</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Masterclasses led by certified agricultural experts to help homes transition to self-sufficient organic living.
          </p>
        </div>
      </div>
    </div>
  );
}
