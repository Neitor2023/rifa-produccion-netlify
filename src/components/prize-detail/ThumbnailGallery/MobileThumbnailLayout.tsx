
import React, { useRef, useEffect } from 'react';
import SafeImage from '@/components/SafeImage';

interface MobileThumbnailLayoutProps {
  images: { displayUrl: string }[];
  currentIndex: number;
  onThumbnailClick: (index: number) => void;
  debugMode?: boolean;
}

const MobileThumbnailLayout: React.FC<MobileThumbnailLayoutProps> = ({
  images,
  currentIndex,
  onThumbnailClick,
  debugMode = false
}) => {
  const thumbnailsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  // Reset refs when images change
  useEffect(() => {
    thumbnailsRef.current = thumbnailsRef.current.slice(0, images.length);
  }, [images.length]);
  
  // Split images into rows
  const firstRowCount = Math.ceil(images.length / 2);
  const firstRow = images.slice(0, firstRowCount);
  const secondRow = images.slice(firstRowCount);
  
  // Handler for thumbnail clicks
  const handleThumbnailClick = (index: number) => {
    if (debugMode) {
      console.log('Mobile thumbnail clicked:', index, 'current:', currentIndex);
    }
    
    onThumbnailClick(index);
  };
  
  return (
    <div className="flex flex-col gap-2">
      <div 
        className="flex flex-nowrap overflow-x-auto gap-2 snap-x snap-mandatory scroll-smooth hide-scrollbar px-2"
        style={{ 
          WebkitOverflowScrolling: 'touch', 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {firstRow.map((image, index) => (
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
      
      {secondRow.length > 0 && (
        <div 
          className="flex flex-nowrap overflow-x-auto gap-2 snap-x snap-mandatory scroll-smooth hide-scrollbar px-2"
          style={{ 
            WebkitOverflowScrolling: 'touch', 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {secondRow.map((image, index) => {
            const actualIndex = index + firstRowCount;
            return (
              <div 
                key={actualIndex}
                ref={el => thumbnailsRef.current[actualIndex] = el}
                className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer snap-center border-2 ${
                  actualIndex === currentIndex ? 'border-blue-500 dark:border-blue-400' : 'border-transparent'
                }`}
                onClick={() => handleThumbnailClick(actualIndex)}
              >
                <SafeImage 
                  src={image.displayUrl} 
                  alt={`Thumbnail ${actualIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileThumbnailLayout;
