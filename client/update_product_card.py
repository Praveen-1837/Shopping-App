import re

with open('/home/praveenshinde/Shopping app/client/src/components/ProductCard.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { useState } from 'react';", "import { useState, useEffect, useRef } from 'react';")

# 2. Add Hooks and Image Arrays
old_hooks = """  const [added, setAdded] = useState<boolean>(false);

  const primaryImage =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';"""

new_hooks = """  const [added, setAdded] = useState<boolean>(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (images.length > 1 && isVisible && !isHovered) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [images.length, isVisible, isHovered]);"""

content = content.replace(old_hooks, new_hooks)

# 3. Update the JSX Image Container
old_jsx = """      <div>
        {/* Product Image Container */}
        <div className="relative aspect-square sm:aspect-[4/3] bg-background-muted overflow-hidden">
          <Link to={`/product/${product.id}`}>
            <img
              src={optimizeCloudinaryUrl(primaryImage, 600, 600)}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>"""

new_jsx = """      <div>
        {/* Product Image Container */}
        <div 
          ref={containerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative aspect-square sm:aspect-[4/3] bg-background-muted overflow-hidden"
        >
          <Link to={`/product/${product.id}`}>
            <img
              src={optimizeCloudinaryUrl(images[currentImageIndex], 600, 600)}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>

          {/* Carousel Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1.5 z-10 pointer-events-none">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex ? 'bg-white scale-125 shadow-sm' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}"""

content = content.replace(old_jsx, new_jsx)

with open('/home/praveenshinde/Shopping app/client/src/components/ProductCard.tsx', 'w') as f:
    f.write(content)

