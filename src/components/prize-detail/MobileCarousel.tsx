
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PrizeImage from './PrizeImage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  return (
    <div className="md:hidden mb-6 relative">
      <Carousel className="w-full" opts={{ loop: true, dragFree: true }}>
        <CarouselContent>
          {images.length > 0 ? 
            images.map((image, index) => (
              <CarouselItem key={index} className="pl-0">
                <div className="p-1">
                  <div className="h-[400px] overflow-hidden rounded-lg">
                    <PrizeImage
                      src={image.displayUrl}
                      alt={`${imageTitle} - Image ${index + 1}`}
                      className="h-[400px] object-contain"
                    />
                  </div>
                </div>
              </CarouselItem>
            )) : 
            fallbackImage && (
              <CarouselItem>
                <div className="p-1">
                  <div className="h-[400px] overflow-hidden rounded-lg">
                    <PrizeImage 
                      src={fallbackImage} 
                      alt={imageTitle}
                      className="h-[400px] object-contain"
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
    </div>
  );
};

export default MobileCarousel;
