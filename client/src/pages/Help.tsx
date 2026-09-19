/* TODO: Populate with production Help Center articles & dynamic search before launch */
import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function Help() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I track my order status?',
      a: 'Once your order is confirmed, you can track its real-time fulfillment stepper (Confirmed → Packed → Shipped → Delivered) under your Orders page.',
    },
    {
      q: 'Are all products certified organic?',
      a: 'All sellers and farmers are verified by our team. Sustainability tags and producer origin details are transparently displayed on each product detail page.',
    },
    {
      q: 'How do masterclass courses work?',
      a: 'Purchasing a course instantly unlocks video modules in your Learning workspace. You can learn at your own pace and receive a verifiable certificate upon completion.',
    },
    {
      q: 'What payment methods do you support?',
      a: 'We accept Credit/Debit Cards, UPI, NetBanking, and Digital Wallets via our secure payment gateway seam.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3 py-1 rounded-full text-sm font-semibold">
          <HelpCircle className="w-4 h-4" />
          <span>Support Center</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-primary">How can we help you?</h1>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold font-heading">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-background-card rounded-2xl border border-text-muted/15 shadow-soft overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-heading font-bold text-base text-text-primary hover:bg-background-muted/50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-text-muted/10 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
