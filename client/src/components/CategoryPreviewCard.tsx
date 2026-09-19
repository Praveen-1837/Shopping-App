import { optimizeCloudinaryUrl } from "../utils/formatters";
import { ArrowRight, Sprout, Leaf, Sun, Recycle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface CategoryPreviewItem {
  id: string;
  title: string;
  image: string;
}

interface CategoryPreviewCardProps {
  category: string;
  imageUrl?: string | null;
  items?: CategoryPreviewItem[];
  linkType?: 'category' | 'producerRole' | 'courses';
  linkValue?: string;
  onSelectCategory?: (category: string, producerRole?: string) => void;
}

// Ecology-themed icon set for filler placeholder slots
const ECO_PLACEHOLDER_SLOTS = [
  { icon: Sprout, label: 'Coming soon' },
  { icon: Leaf, label: 'Coming soon' },
  { icon: Sun, label: 'Coming soon' },
  { icon: Recycle, label: 'Coming soon' },
];

export default function CategoryPreviewCard({
  category,
  items = [],
  linkType = 'category',
  linkValue = '',
  onSelectCategory,
}: CategoryPreviewCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (linkType === 'courses') {
      navigate('/courses');
    } else if (linkType === 'producerRole') {
      if (onSelectCategory) {
        onSelectCategory('All Categories', linkValue);
      } else {
        navigate(`/shop?producerRole=${encodeURIComponent(linkValue)}`);
      }
    } else {
      if (onSelectCategory) {
        onSelectCategory(category);
      } else {
        navigate(`/shop/category/${encodeURIComponent(category)}`);
      }
    }
  };

  const totalSlots = 4;
  const realItems = (items || []).slice(0, 4);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Explore ${category} category`}
      className="relative z-10 w-full bg-white dark:bg-background-card border border-text-muted/15 rounded-xl sm:rounded-3xl p-2 sm:p-5 shadow-sm sm:shadow-card hover:shadow-md sm:hover:shadow-2xl hover:border-primary/40 hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-300 flex flex-col items-center sm:items-stretch sm:justify-between h-full gap-1 sm:gap-0 sm:space-y-4 group cursor-pointer select-none text-center sm:text-left"
    >
      {/* Category Heading (Clickable target) */}
      <div
        onClick={handleCardClick}
        className="flex flex-col sm:flex-row items-center sm:justify-between cursor-pointer w-full"
        title={`Explore ${category}`}
      >
        <span className="p-2 sm:p-1.5 bg-primary-light/50 sm:bg-primary-light text-primary rounded-full sm:rounded-xl shrink-0 group-hover:bg-primary group-hover:text-white transition-colors mb-1 sm:mb-0">
          <Sprout className="w-5 h-5 sm:w-4 sm:h-4" />
        </span>
        <h3 className="font-heading font-bold sm:font-extrabold text-[10px] leading-tight sm:text-base md:text-base text-text-primary tracking-tight group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-none break-words w-full">
          {category}
        </h3>
        <span className="block sm:hidden text-[9px] text-text-muted mt-0.5">{items.length} items</span>
      </div>

      {/* 2x2 Quadrant Grid Container */}
      <div
        onClick={handleCardClick}
        className="hidden sm:grid grid-cols-2 gap-3 aspect-square w-full rounded-2xl overflow-hidden bg-background-muted/40 p-2 border border-text-muted/10 cursor-pointer"
        title={`Browse all ${category} products`}
      >
        {Array.from({ length: totalSlots }).map((_, slotIndex) => {
          const realItem = realItems[slotIndex];

          if (realItem) {
            // Real Product Tile — Surface background #F7F7F7 during image load
            return (
              <div
                key={realItem.id || slotIndex}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
                className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#F7F7F7] dark:bg-background-muted border border-text-muted/10 shadow-xs group/slot cursor-pointer"
                title={`Browse ${category}: ${realItem.title}`}
              >
                <img
                  src={optimizeCloudinaryUrl(realItem.image, 300, 300)}
                  alt={realItem.title}
                  className="w-full h-full object-cover group-hover/slot:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-1.5">
                  <p className="text-[10px] text-white font-bold leading-tight break-words drop-shadow-xs">
                    {realItem.title}
                  </p>
                </div>
              </div>
            );
          }

          // Ecology-Themed Placeholder / Filler Tile
          const ecoItem = ECO_PLACEHOLDER_SLOTS[slotIndex % ECO_PLACEHOLDER_SLOTS.length];
          const EcoIcon = ecoItem.icon;

          return (
            <div
              key={`placeholder-${slotIndex}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="aspect-square w-full rounded-xl bg-primary-light/60 dark:bg-primary/10 border border-primary/20 hover:border-primary/40 flex flex-col items-center justify-center p-2 text-center space-y-1 transition-colors group/filler cursor-pointer"
              title={`Browse ${category}`}
            >
              <div className="p-1.5 bg-white/90 dark:bg-black/40 rounded-xl shadow-2xs group-hover/filler:scale-110 transition-transform">
                <EcoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary stroke-[1.75]" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-primary/90 font-heading tracking-tight uppercase leading-none">
                Coming soon
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Link Action */}
      <div
        onClick={handleCardClick}
        className="hidden sm:flex items-center justify-between text-sm sm:text-base font-bold text-primary group-hover:text-primary-hover pt-1 cursor-pointer"
        title={`Shop ${category}`}
      >
        <span className="inline-flex items-center space-x-1.5">
          <span>Shop {category}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  );
}
