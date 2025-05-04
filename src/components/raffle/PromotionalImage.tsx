
import React from 'react';
import SafeImage from '@/components/SafeImage';

interface PromotionalImageProps {
  imageUrl: string;
}

const PromotionalImage: React.FC<PromotionalImageProps> = ({ imageUrl }) => {
  return (
    <div className="mb-8 mt-8">
      <div className="overflow-hidden rounded-lg shadow-md">
        <SafeImage 
          src={imageUrl} 
          alt="Promotional Image"
          className="w-full h-auto object-cover"
          containerClassName="max-w-full"
        />
      </div>
    </div>
  );
};

export default PromotionalImage;
