
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
  
  // Process Google Drive links to get direct image URLs
  const processGoogleDriveUrl = (url: string): string => {
    if (url && url.includes('drive.google.com/file/d/')) {
      // Extract the file ID from the Google Drive URL
      const fileIdMatch = url.match(/\/d\/([^\/]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        // Return a direct download link
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
    return url;
  };
  
  // Improved source validation
  const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    return url.trim() !== '' && 
      (url.startsWith('http://') || 
       url.startsWith('https://') || 
       url.startsWith('/'));
  };
  
  // Process URL and validate
  const processedSrc = src && typeof src === 'string' ? processGoogleDriveUrl(src) : null;
  const validSrc = processedSrc && isValidUrl(processedSrc);
  
  // Log for debugging purposes
  console.log(`SafeImage for ${alt}: original=${src}, processed=${processedSrc}, valid=${validSrc}`);
  
  // Handler for image load errors
  const handleError = () => {
    console.log(`Image load error for ${alt}: ${processedSrc}`);
    setHasError(true);
  };

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {!hasError && validSrc ? (
        <img
          src={processedSrc || ''}
          alt={alt}
          width={width}
          height={height}
          className={cn('w-full h-full object-contain', className)}
          onError={handleError}
          loading="lazy"
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
