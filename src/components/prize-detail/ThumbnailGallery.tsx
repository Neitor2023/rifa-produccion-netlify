
import React, { useRef, useEffect, useState } from 'react';
import SafeImage from '@/components/SafeImage';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import DebugModal from '../DebugModal';

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
  const thumbnailsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isMobile = useIsMobile();
  const [debugMode, setDebugMode] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  
  // Check for debug mode
  useEffect(() => {
    const checkDebugMode = async () => {
      try {
        const { data } = await supabase
          .from('organization')
          .select('modal')
          .limit(1)
          .single();
        
        setDebugMode(data?.modal === 'programador');
      } catch (error) {
        console.error('Error checking debug mode:', error);
      }
    };
    
    checkDebugMode();
  }, []);
  
  if (images.length <= 1) return null;

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
  
  // Handler for thumbnail clicks with immediate index propagation and debug info
  const handleThumbnailClick = (index: number) => {
    // Collect debug info before updating state
    if (debugMode) {
      const debugInfo = {
        event: 'thumbnail-click',
        clickedIndex: index,
        currentIndex: currentIndex,
        thumbElement: thumbnailsRef.current[index] ? {
          offsetLeft: thumbnailsRef.current[index]?.offsetLeft,
          offsetWidth: thumbnailsRef.current[index]?.offsetWidth
        } : null,
        scrollContainer: scrollContainerRef.current ? {
          offsetWidth: scrollContainerRef.current.offsetWidth,
          scrollLeft: scrollContainerRef.current.scrollLeft
        } : null,
        imageUrl: images[index]?.displayUrl || 'no-url',
        totalImages: images.length
      };
      
      setDebugData(debugInfo);
      setIsDebugModalOpen(true);
      console.log('Thumbnail clicked with debug info:', debugInfo);
    }
    
    // Immediate index update
    if (index !== currentIndex) {
      // Call the handler with the new index
      onThumbnailClick(index);
    } else {
      // Force a re-render even if clicking the same thumbnail
      onThumbnailClick(index);
    }
  };
  
  // Split images into rows for mobile view
  const renderMobileThumbnails = () => {
    const firstRowCount = Math.ceil(images.length / 2);
    const firstRow = images.slice(0, firstRowCount);
    const secondRow = images.slice(firstRowCount);
    
    return (
      <div className="flex flex-col gap-2">
        <div 
          ref={scrollContainerRef}
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
  
  return (
    <>
      {isMobile ? (
        renderMobileThumbnails()
      ) : (
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
      )}
      
      {/* Debug modal */}
      {debugMode && (
        <DebugModal
          isOpen={isDebugModalOpen}
          onClose={() => setIsDebugModalOpen(false)}
          data={debugData}
          title="🛠️ Thumbnail Gallery Debug"
        />
      )}
    </>
  );
};

export default ThumbnailGallery;
