import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { PromoBanner } from '../types/banner';
import { optimizeCloudinaryUrl } from "../utils/formatters";
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export default function HeroBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { data, isLoading } = useQuery<{ success: boolean; data: PromoBanner[] }>({
    queryKey: ['active-banners'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: PromoBanner[] }>('/banners');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const banners = data?.data || [];

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

  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.targetTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (diff > 50) {
      nextSlide();
      setTouchStart(null);
    } else if (diff < -50) {
      prevSlide();
      setTouchStart(null);
    }
  };
  const handleTouchEnd = () => setTouchStart(null);

  return (
    <section
      aria-label="Promotional Banners"
      className="relative w-full overflow-hidden transition-all group bg-[#112415] rounded-xl sm:rounded-3xl mx-auto my-2 sm:my-0 max-w-[calc(100%-16px)] sm:max-w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="flex w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className="relative min-w-full h-36 sm:h-[400px] md:h-[500px] shrink-0 bg-black overflow-hidden"
          >
            {/* Background Image */}
            <img
              src={optimizeCloudinaryUrl(banner.imageUrl, 1200, 600)}
              alt={banner.title}
              className="w-full h-full object-cover opacity-80"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent sm:from-black/80 sm:via-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent sm:from-black/60 pointer-events-none" />

            {/* Caption Text Box */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-12 md:bottom-16 px-4 sm:px-10 md:px-16 flex flex-col items-start z-10 pointer-events-auto">
              <div className="max-w-[75%] sm:max-w-full md:max-w-3xl space-y-1 sm:space-y-4">

                <h2 className="text-base sm:text-3xl md:text-5xl font-black font-heading text-white leading-tight tracking-tight text-balance break-words line-clamp-2">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="hidden sm:block text-sm sm:text-base md:text-lg text-gray-200 font-medium text-balance break-words max-w-full">
                    {banner.subtitle}
                  </p>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity duration-200 shadow-md cursor-pointer opacity-90 sm:opacity-80 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity duration-200 shadow-md cursor-pointer opacity-90 sm:opacity-80 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-30 flex items-center space-x-1.5 sm:space-x-2.5 pointer-events-auto bg-black/30 sm:bg-black/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-sm">
            {banners.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-primary' : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/70 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
