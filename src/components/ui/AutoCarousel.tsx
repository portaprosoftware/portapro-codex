import React from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface AutoCarouselProps {
  images: string[];
  className?: string;
  aspectRatio?: string;
}

export const AutoCarousel: React.FC<AutoCarouselProps> = ({ 
  images, 
  className = "",
  aspectRatio = "aspect-video"
}) => {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <div className={className}>
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className={`${aspectRatio} overflow-hidden rounded-xl`}>
                <img
                  src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=800&q=80`}
                  alt={`Feature showcase ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};