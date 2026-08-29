import { Link } from 'react-router-dom';
import { Sprout, MapPin } from 'lucide-react';

interface ProducerBadgeProps {
  producer: {
    id: string;
    name: string;
    location?: string;
  };
}

export default function ProducerBadge({ producer }: ProducerBadgeProps) {
  if (!producer) return null;

  return (
    <Link
      to={`/producer/${producer.id}`}
      className="inline-flex items-center space-x-2 bg-secondary-light/60 hover:bg-secondary-light border border-secondary/30 rounded-xl px-3 py-1.5 transition-all text-xs font-semibold text-secondary group"
    >
      <Sprout className="w-4 h-4 text-secondary group-hover:scale-110 transition-transform" />
      <div>
        <span className="block text-[11px] leading-tight font-bold">{producer.name}</span>
        {producer.location && (
          <span className="inline-flex items-center text-[10px] text-text-muted font-normal">
            <MapPin className="w-3 h-3 mr-0.5" />
            {producer.location}
          </span>
        )}
      </div>
    </Link>
  );
}
