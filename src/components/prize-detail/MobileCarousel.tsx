
import React from 'react';
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
}

const MobileCarousel: React.FC<MobileCarouselProps> = ({ 
  images, 
  fallbackImage,
  imageTitle
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="md:hidden mb-4 relative">
      <Carousel className="w-full mx-auto" opts={{ loop: true, dragFree: true, align: "start" }}>
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
        {images.length > 1 && !isMobile && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 opacity-70 hover:opacity-100 shadow-md" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 opacity-70 hover:opacity-100 shadow-md" />
          </>
        )}
      </Carousel>
      
      {/* Instructional text for mobile users */}
      {isMobile && images.length > 1 && (
        <p className="text-sm text-right text-muted-foreground mt-2 mb-4 px-2">
          🧭 Deslice con el dedo hacia los lados para ver más imágenes
        </p>
      )}
    </div>
  );
};

export default MobileCarousel;
