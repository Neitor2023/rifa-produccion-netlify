
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PrizeImage from './PrizeImage';

interface ImageCarouselProps {
  images: { displayUrl: string }[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  imageTitle: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  currentIndex, 
  onPrev, 
  onNext,
  imageTitle
}) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="relative mb-6 hidden md:block">
      <div className="w-full h-[500px] overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        {/*<div className="mb-4">*/}
          <div className="text-base font-bold text-gray-600 dark:text-gray-400 text-sm">
<p className="text-base font-bold text-gray-600 dark:text-gray-400 text-sm">
  Deslice hacia los lados para ver más imágenes
</p>
<p className="text-base font-bold text-gray-600 dark:text-gray-400 text-sm">
  Deslice hacia abajo para ver más detalles
</p>

          </div>
        {/*</div>*/}
        
        <PrizeImage 
          src={images[currentIndex]?.displayUrl} 
          alt={`${imageTitle} - ${currentIndex + 1}`}
          className="h-[500px] object-contain"
        />
      </div>
      
      {images.length > 1 && (
        <>
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full dark:bg-gray-800/80 dark:hover:bg-gray-700 shadow-md"
            onClick={onPrev}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full dark:bg-gray-800/80 dark:hover:bg-gray-700 shadow-md"
            onClick={onNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, index) => (
              <div 
                key={index}
                className={`h-2 w-2 rounded-full cursor-pointer ${index === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                onClick={() => onNext()}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
