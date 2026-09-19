/* TODO: Update with active job openings & career application process before launch */
import { Briefcase, MapPin, Sparkles } from 'lucide-react';

export default function Careers() {
  const openPositions = [
    { title: 'Senior Agritech Full-Stack Engineer', department: 'Engineering', location: 'Bengaluru / Remote' },
    { title: 'Sustainability & Supplier Audit Manager', department: 'Operations', location: 'Pune / On-site' },
    { title: 'Community & Learning Experience Lead', department: 'Content & Education', location: 'Remote' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3 border-b border-text-muted/15 pb-6">
        <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3 py-1 rounded-full text-sm font-semibold">
          <Briefcase className="w-4 h-4" />
          <span>Work With Us</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-primary">Careers at EcoMarket</h1>
        <p className="text-base text-text-secondary">
          Join our mission to build a sustainable, transparent, and fair agricultural ecosystem.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold font-heading">Current Openings</h3>
        <div className="space-y-3">
          {openPositions.map((pos, idx) => (
            <div
              key={idx}
              className="bg-background-card rounded-2xl p-5 border border-text-muted/15 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h4 className="font-heading font-bold text-base text-text-primary">{pos.title}</h4>
                <div className="flex items-center space-x-3 text-sm text-text-muted mt-1">
                  <span>{pos.department}</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-primary" />
                    {pos.location}
                  </span>
                </div>
              </div>

              <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer w-fit">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
