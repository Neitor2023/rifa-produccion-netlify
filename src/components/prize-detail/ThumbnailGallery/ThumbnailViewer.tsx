
import React, { useRef, useEffect } from 'react';
import SafeImage from '@/components/SafeImage';

interface ThumbnailViewerProps {
  images: { displayUrl: string }[];
  currentIndex: number;
  onThumbnailClick: (index: number) => void;
  debugMode?: boolean;
}

const ThumbnailViewer: React.FC<ThumbnailViewerProps> = ({
  images,
  currentIndex,
  onThumbnailClick,
  debugMode = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  // Reset refs when images change
  useEffect(() => {
    thumbnailsRef.current = thumbnailsRef.current.slice(0, images.length);
  }, [images.length]);
  
  // Scroll the active thumbnail into view when it changes
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const activeThumb = thumbnailsRef.current[currentIndex];
    if (!activeThumb) return;
    
    const container = scrollContainerRef.current;
    const containerWidth = container.offsetWidth;
    const thumbLeft = activeThumb.offsetLeft;
    const thumbWidth = activeThumb.offsetWidth;
    
    // Calculate the scroll position to center the thumbnail
    const scrollPos = thumbLeft - (containerWidth / 2) + (thumbWidth / 2);
    
    if (debugMode) {
      console.log(`Scrolling thumbnail at index ${currentIndex} into view`, {
        containerWidth,
        thumbLeft,
        thumbWidth,
        calculatedScrollPos: scrollPos
      });
    }
    
    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      container.scrollTo({
        left: scrollPos,
        behavior: 'smooth'
      });
    });
  }, [currentIndex, debugMode]);
  
  // Handler for thumbnail clicks
  const handleThumbnailClick = (index: number) => {
    if (index !== currentIndex) {
      onThumbnailClick(index);
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="flex flex-nowrap overflow-x-auto gap-2 mb-6 pb-2 px-2 snap-x snap-mandatory scroll-smooth hide-scrollbar mx-auto"
      style={{ 
        WebkitOverflowScrolling: 'touch', 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {images.map((image, index) => (
        <div 
          key={index}
          ref={el => thumbnailsRef.current[index] = el}
          className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer snap-center border-2 ${
            index === currentIndex ? 'border-blue-500 dark:border-blue-400' : 'border-transparent'
          }`}
          onClick={() => handleThumbnailClick(index)}
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

export default ThumbnailViewer;
