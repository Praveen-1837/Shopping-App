import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { PromoBanner } from '../types/banner';
import { optimizeCloudinaryUrl } from "../utils/formatters";
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fetch active banners
  const { data, isLoading } = useQuery<{ success: boolean; data: PromoBanner[] }>({
    queryKey: ['active-banners'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: PromoBanner[] }>('/banners');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const banners = data?.data || [];

  // Auto-advance logic
  useEffect(() => {
    if (banners.length <= 1 || isPaused || prefersReducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isPaused, prefersReducedMotion]);

  if (isLoading || banners.length === 0) {
    return null;
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <section
      aria-label="Promotional Banners"
      className="relative w-full overflow-hidden transition-all group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div
        className="flex w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className="relative min-w-full h-[280px] sm:h-[320px] md:h-[420px] lg:h-[540px] flex items-start pt-8 sm:pt-12 md:pt-16 lg:pt-20 shrink-0"
          >
            {/* Background Hero Image */}
            <img
              src={optimizeCloudinaryUrl(banner.imageUrl, 1440, 600)}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />

            {/* Dark Legibility Gradient Overlay for Text */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />

            {/* Slide Content — Heading and Subtitle text */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full text-white space-y-2 sm:space-y-4 pb-16 md:pb-28 lg:pb-36">
              <div className="max-w-md sm:max-w-xl space-y-1.5 sm:space-y-2">
                <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-heading leading-tight drop-shadow-md tracking-tight">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-xs sm:text-base text-gray-200 font-medium line-clamp-2 drop-shadow-xs max-w-lg">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Phase 2: Bottom Gradient Fade Overlay (Anchored seamlessly to #FAF7F2 background) */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none h-32 md:h-56 lg:h-80"
        style={{
          background:
            'linear-gradient(to top, #FAF7F2 0%, rgba(250, 247, 242, 0.95) 35%, rgba(250, 247, 242, 0.5) 70%, transparent 100%)',
        }}
      />

      {/* Navigation Controls — z-30 ensures clickability above gradient overlay */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 sm:left-5 top-1/3 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity duration-200 shadow-md cursor-pointer opacity-80 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 sm:right-5 top-1/3 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity duration-200 shadow-md cursor-pointer opacity-80 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot Indicators — z-30 positioned above the grid overlap zone */}
          <div className="absolute bottom-36 md:bottom-56 lg:bottom-72 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-1.5 pointer-events-auto">
            {banners.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 h-2 bg-primary shadow-md'
                    : 'w-2 h-2 bg-white/70 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
