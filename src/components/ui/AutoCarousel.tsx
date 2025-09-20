import React, { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface AutoCarouselProps {
  media: string[];
  className?: string;
  aspectRatio?: string;
}

const getMediaType = (url: string): 'video' | 'image' => {
  return url.toLowerCase().endsWith('.mp4') ? 'video' : 'image';
};

export const AutoCarousel: React.FC<AutoCarouselProps> = ({ 
  media, 
  className = "",
  aspectRatio = "aspect-video"
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const SLIDE_DURATION = 5000; // 5 seconds

  const plugin = React.useRef(
    Autoplay({ delay: SLIDE_DURATION, stopOnInteraction: false }) as any
  );

  // Safety check: return null if media is not provided or empty
  if (!media || !Array.isArray(media) || media.length === 0) {
    return null;
  }

  // Progress bar animation
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / (SLIDE_DURATION / 50)); // Update every 50ms
      });
    }, 50);

    const timeout = setTimeout(() => {
      setProgress(0);
      clearInterval(interval);
    }, SLIDE_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentSlide]);

  return (
    <div className={`relative ${className}`}>
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
        onSelect={() => {
          setCurrentSlide((prev) => (prev + 1) % media.length);
        }}
      >
        <CarouselContent>
          {media.map((mediaItem, index) => {
            const mediaType = getMediaType(mediaItem);
            return (
              <CarouselItem key={index}>
                <div className={`${aspectRatio} overflow-hidden rounded-xl`}>
                  {mediaType === 'video' ? (
                    <video
                      src={mediaItem}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <img
                      src={mediaItem.startsWith('/') ? mediaItem : `https://images.unsplash.com/${mediaItem}?auto=format&fit=crop&w=800&q=80`}
                      alt={`Feature showcase ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      
      {/* Progress Bar */}
      {media.length > 1 && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-black/20 rounded-full h-1 backdrop-blur-sm">
            <div 
              className="bg-white/80 h-1 rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};