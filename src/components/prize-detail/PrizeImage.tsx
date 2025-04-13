
import React from 'react';
import SafeImage from '@/components/SafeImage';

interface PrizeImageProps {
  src: string | null | undefined;
  alt: string;
  onClick?: () => void;
  className?: string;
}

const PrizeImage: React.FC<PrizeImageProps> = ({ 
  src, 
  alt, 
  onClick,
  className 
}) => {
  return (
    <div 
      className={`w-full h-full overflow-hidden rounded-lg flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} touch-manipulation`}
      onClick={onClick}
    >
      <SafeImage 
        src={src} 
        alt={alt}
        className={`w-full h-full object-contain ${className || ''}`}
      />
    </div>
  );
};

export default PrizeImage;
