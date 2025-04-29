
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
  console.log("▶️ ImageCarousel.tsx: Rendering desktop carousel with", images.length, "images at index", currentIndex);
  
  if (!images || images.length === 0) {
    console.log("▶️ ImageCarousel.tsx: No images to display");
    return null;
  }

  // Make sure currentIndex is within bounds
  const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
  const currentImage = images[safeIndex];
  
  if (!currentImage || !currentImage.displayUrl) {
    console.log("▶️ ImageCarousel.tsx: Current image or URL is null at index", safeIndex);
    return null;
  }
  
  console.log("▶️ ImageCarousel.tsx: Displaying image:", currentImage.displayUrl);

  return (
    <div className="relative mb-6 hidden md:block">
      <div className="w-full h-[500px] overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <PrizeImage 
          src={currentImage.displayUrl} 
          alt={`${imageTitle} - ${safeIndex + 1}`}
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
                className={`h-2 w-2 rounded-full cursor-pointer ${index === safeIndex ? 'bg-white' : 'bg-white/50'}`}
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
