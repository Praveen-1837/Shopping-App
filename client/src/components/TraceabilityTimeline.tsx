import { CheckCircle2, MapPin, Calendar, FileText } from 'lucide-react';

export interface TraceabilityStage {
  stage: string;
  location?: string;
  date?: string;
  note?: string;
}

interface TraceabilityTimelineProps {
  stages?: TraceabilityStage[];
}

export default function TraceabilityTimeline({ stages }: TraceabilityTimelineProps) {
  if (!stages || stages.length === 0) return null;

  return (
    <div className="bg-background-card border border-text-muted/15 rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center space-x-2 border-b border-text-muted/10 pb-4">
        <div className="p-2 bg-primary-light text-primary rounded-xl">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-base text-text-primary">
            Product Journey & Traceability
          </h3>
          <p className="text-sm text-text-muted">
            100% verified supply chain transparency from farm to table
          </p>
        </div>
      </div>

      {/* Stepper Grid */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-primary/20">
        {stages.map((stg, idx) => (
          <div key={idx} className="relative flex items-start space-x-4 group">
            {/* Step Indicator Pin */}
            <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
              {idx + 1}
            </div>

            <div className="bg-background-muted/60 border border-text-muted/10 rounded-2xl p-4 flex-1 space-y-1.5 group-hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-base text-text-primary">
                  {stg.stage}
                </h4>
                {stg.date && (
                  <span className="inline-flex items-center text-[11px] text-text-muted">
                    <Calendar className="w-3 h-3 mr-1 text-primary" />
                    {stg.date}
                  </span>
                )}
              </div>

              {stg.location && (
                <p className="inline-flex items-center text-sm text-primary font-medium">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {stg.location}
                </p>
              )}

              {stg.note && (
                <p className="text-sm text-text-muted leading-relaxed pt-1">
                  {stg.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
