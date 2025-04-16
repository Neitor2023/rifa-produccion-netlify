
import React, { useRef, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PrizeImage from './PrizeImage';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileCarouselProps {
  images: { displayUrl: string }[];
  fallbackImage?: string;
  imageTitle: string;
  currentIndex?: number;
  onSlideChange?: (index: number) => void;
}

const MobileCarousel: React.FC<MobileCarouselProps> = ({ 
  images, 
  fallbackImage,
  imageTitle,
  currentIndex = 0,
  onSlideChange
}) => {
  const isMobile = useIsMobile();
  const carouselApiRef = useRef<any>(null);
  const lastIndexRef = useRef<number>(currentIndex);
  
  // Function to handle API setup
  const handleApiChange = (api: any) => {
    carouselApiRef.current = api;
    
    // Add event listener for slide changes
    if (api && onSlideChange) {
      api.on('select', () => {
        const index = api.selectedScrollSnap();
        onSlideChange(index);
      });
    }
  };
  
  // Function to programmatically scroll to a specific index
  useEffect(() => {
    if (carouselApiRef.current && typeof currentIndex === 'number') {
      // Force scroll even if the index is the same as before
      const api = carouselApiRef.current;
      
      // Use setTimeout to ensure the carousel API is fully initialized
      setTimeout(() => {
        if (api && api.scrollTo) {
          api.scrollTo(currentIndex);
          lastIndexRef.current = currentIndex;
        }
      }, 0);
    }
  }, [currentIndex]);
  
  return (
    <div className="md:hidden mb-4 relative">
      <Carousel 
        className="w-full mx-auto" 
        opts={{ loop: true, dragFree: true, align: "start" }}
        setApi={handleApiChange}
      >
        <CarouselContent className="-ml-0 md:-ml-0">
          {images.length > 0 ? 
            images.map((image, index) => (
              <CarouselItem key={index} className="pl-0 basis-[85%] ml-0">
                <div className="p-1">
                  <div className="h-[400px] overflow-hidden rounded-lg">
                    <PrizeImage
                      src={image.displayUrl}
                      alt={`${imageTitle} - Image ${index + 1}`}
                      className="h-[400px] object-contain mx-auto"
                    />
                  </div>
                </div>
              </CarouselItem>
            )) : 
            fallbackImage && (
              <CarouselItem className="pl-0 basis-full ml-0">
                <div className="p-1">
                  <div className="h-[400px] overflow-hidden rounded-lg">
                    <PrizeImage 
                      src={fallbackImage} 
                      alt={imageTitle}
                      className="h-[400px] object-contain mx-auto"
                    />
                  </div>
                </div>
              </CarouselItem>
            )
          }
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 opacity-70 hover:opacity-100 shadow-md" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 opacity-70 hover:opacity-100 shadow-md" />
          </>
        )}
      </Carousel>
      
      {/* Instructional text for mobile users */}
      {images.length > 1 && (
        <p className="text-sm text-left text-muted-foreground mt-2 mb-4 px-0">
          🧭 Deslice hacia los lados para ver más
        </p>
      )}
    </div>
  );
};

export default MobileCarousel;
