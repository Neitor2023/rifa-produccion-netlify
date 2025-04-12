
import React from 'react';
import SafeImage from '@/components/SafeImage';

interface PrizeImageProps {
  src: string | null | undefined;
  alt: string;
  onClick?: () => void;
}

const PrizeImage: React.FC<PrizeImageProps> = ({ src, alt, onClick }) => {
  return (
    <div 
      className="w-full h-full overflow-hidden rounded-lg cursor-pointer"
      onClick={onClick}
    >
      <SafeImage 
        src={src} 
        alt={alt}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default PrizeImage;
