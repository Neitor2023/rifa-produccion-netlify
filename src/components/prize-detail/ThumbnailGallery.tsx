
import React, { useRef } from 'react';
import SafeImage from '@/components/SafeImage';
import { useIsMobile } from '@/hooks/use-mobile';

interface ThumbnailGalleryProps {
  images: { displayUrl: string }[];
  currentIndex: number;
  onThumbnailClick: (index: number) => void;
}

const ThumbnailGallery: React.FC<ThumbnailGalleryProps> = ({ 
  images, 
  currentIndex, 
  onThumbnailClick 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  if (images.length <= 1) return null;
  
  // Scroll the active thumbnail into view when it changes
  React.useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const activeThumb = container.children[currentIndex] as HTMLElement;
    
    if (activeThumb) {
      const containerWidth = container.offsetWidth;
      const thumbLeft = activeThumb.offsetLeft;
      const thumbWidth = activeThumb.offsetWidth;
      
      // Calculate the scroll position to center the thumbnail
      const scrollPos = thumbLeft - (containerWidth / 2) + (thumbWidth / 2);
      container.scrollTo({
        left: scrollPos,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);
  
  return (
    <div 
      ref={scrollContainerRef}
      className="flex overflow-x-auto gap-2 mb-6 pb-2 px-1 snap-x snap-mandatory scroll-smooth hide-scrollbar"
      style={{ 
        WebkitOverflowScrolling: 'touch', 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {images.map((image, index) => (
        <div 
          key={index}
          className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} flex-shrink-0 rounded-md overflow-hidden cursor-pointer snap-center border-2 ${
            index === currentIndex ? 'border-blue-500 dark:border-blue-400' : 'border-transparent'
          }`}
          onClick={() => onThumbnailClick(index)}
        >
          <SafeImage 
            src={image.displayUrl} 
            alt={`Thumbnail ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

export default ThumbnailGallery;
