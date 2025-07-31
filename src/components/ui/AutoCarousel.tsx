import React from "react";
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
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  );

  // Safety check: return null if media is not provided or empty
  if (!media || !Array.isArray(media) || media.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
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
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <img
                      src={`https://images.unsplash.com/${mediaItem}?auto=format&fit=crop&w=800&q=80`}
                      alt={`Feature showcase ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};