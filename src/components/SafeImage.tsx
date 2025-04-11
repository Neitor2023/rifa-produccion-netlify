
import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  fallbackClassName = '',
  width,
  height,
}) => {
  const [hasError, setHasError] = useState(false);
  
  // Improved source validation
  const validSrc = typeof src === 'string' && src.trim() !== '' && 
    (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'));

  // Log for debugging purposes
  console.log(`SafeImage for ${alt}: src=${src}, validSrc=${validSrc}`);
  
  // Handler for image load errors
  const handleError = () => {
    console.log(`Image load error for ${alt}: ${src}`);
    setHasError(true);
  };

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {!hasError && validSrc ? (
        <img
          src={src || ''}
          alt={alt}
          width={width}
          height={height}
          className={cn('w-full h-full object-cover', className)}
          onError={handleError}
        />
      ) : (
        <div 
          className={cn(
            'w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800',
            fallbackClassName
          )}
        >
          <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
    </div>
  );
};

export default SafeImage;
