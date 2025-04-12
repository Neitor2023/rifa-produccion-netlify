
import React from 'react';
import SafeImage from '@/components/SafeImage';

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
  if (images.length <= 1) return null;
  
  return (
    <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
      {images.map((image, index) => (
        <div 
          key={index}
          className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 ${
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
