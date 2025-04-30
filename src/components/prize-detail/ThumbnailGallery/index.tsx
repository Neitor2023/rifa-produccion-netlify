
import React from 'react';
import ThumbnailViewer from './ThumbnailViewer';
import MobileThumbnailLayout from './MobileThumbnailLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import DebugModal from '@/components/DebugModal';
import { useDebugMode } from './useDebugMode';

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
  const isMobile = useIsMobile();
  const { debugMode, isDebugModalOpen, setIsDebugModalOpen, debugData } = useDebugMode();
  
  // Early return with empty fragment instead of null
  if (images.length <= 1) return <></>;
  
  return (
    <>
      {isMobile ? (
        <MobileThumbnailLayout 
          images={images} 
          currentIndex={currentIndex} 
          onThumbnailClick={onThumbnailClick} 
          debugMode={debugMode}
        />
      ) : (
        <ThumbnailViewer 
          images={images} 
          currentIndex={currentIndex} 
          onThumbnailClick={onThumbnailClick}
          debugMode={debugMode}
        />
      )}
      
      {/* Debug modal - Always render but conditionally show */}
      <DebugModal
        isOpen={debugMode && isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        data={debugData}
        title="🛠️ Thumbnail Gallery Debug"
      />
    </>
  );
};

export default ThumbnailGallery;
