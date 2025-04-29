
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Prize, PrizeImage } from '@/lib/constants';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ImageCarousel from './prize-detail/ImageCarousel';
import MobileCarousel from './prize-detail/MobileCarousel';
import ThumbnailGallery from './prize-detail/ThumbnailGallery';
import PrizeDescription from './prize-detail/PrizeDescription';

interface PrizeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prize: Prize | null;
  prizeImages: PrizeImage[];
}

const PrizeDetailModal: React.FC<PrizeDetailModalProps> = ({ isOpen, onClose, prize, prizeImages }) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  
  console.log("▶️ PrizeDetailModal.tsx: Opened with prize:", prize?.name, "and", prizeImages.length, "images");
  
  // Reset current image index when prize changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
    console.log("▶️ PrizeDetailModal.tsx: Reset image index for new prize:", prize?.name);
  }, [prize]);
  
  // Use either url_image or image_url depending on what's available
  const relevantImages = React.useMemo(() => {
    if (!prize) return [];
    
    // Filter images for the current prize
    const filteredImages = prizeImages
      .filter(img => img.prize_id === prize.id)
      .map(img => ({
        ...img,
        displayUrl: img.url_image || img.image_url
      }));
      
    console.log(`▶️ PrizeDetailModal.tsx: Found ${filteredImages.length} images for prize ${prize?.name}:`, 
      filteredImages.map(img => img.displayUrl));
    
    // If no prize-specific images are found but prize has its own image, create an entry for it
    if (filteredImages.length === 0 && prize.url_image) {
      console.log("▶️ PrizeDetailModal.tsx: Using prize's own image:", prize.url_image);
      return [{
        id: 'default',
        prize_id: prize.id,
        image_url: prize.url_image,
        url_image: prize.url_image,
        displayUrl: prize.url_image
      }];
    }
    
    return filteredImages;
  }, [prize, prizeImages]);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => {
      const newIndex = prev > 0 ? prev - 1 : relevantImages.length - 1;
      console.log("▶️ PrizeDetailModal.tsx: Moving to previous image, index:", newIndex);
      return newIndex;
    });
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => {
      const newIndex = prev < relevantImages.length - 1 ? prev + 1 : 0;
      console.log("▶️ PrizeDetailModal.tsx: Moving to next image, index:", newIndex);
      return newIndex;
    });
  };

  // Main image to display (from prize images or prize.url_image)
  const mainImageUrl = relevantImages.length > 0 
    ? relevantImages[currentImageIndex]?.displayUrl 
    : prize?.url_image;

  console.log("▶️ PrizeDetailModal.tsx: Main image URL:", mainImageUrl);
  console.log("▶️ PrizeDetailModal.tsx: Current image index:", currentImageIndex, "of", relevantImages.length);

  if (!prize) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] flex flex-col">
        {/* Close button in the top right */}
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <DialogHeader className="pt-6">
          <DialogTitle className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">
            {prize.name}
          </DialogTitle>
        </DialogHeader>
        
        {/* ScrollArea to enable scrolling for long content */}
        <ScrollArea className="flex-1 overflow-y-auto px-1">
          <div className="py-4">
            {/* Image carousel - Standard layout for larger displays */}
            <ImageCarousel 
              images={relevantImages}
              currentIndex={currentImageIndex}
              onPrev={handlePrevImage}
              onNext={handleNextImage}
              imageTitle={prize.name}
            />
            
            {/* Embla Carousel for mobile devices */}
            <MobileCarousel 
              images={relevantImages}
              fallbackImage={prize.url_image}
              imageTitle={prize.name}
              currentIndex={currentImageIndex}
              onSlideChange={setCurrentImageIndex}
            />
            
            {/* Thumbnail gallery for multiple images - visible on both mobile and desktop */}
            <ThumbnailGallery 
              images={relevantImages}
              currentIndex={currentImageIndex}
              onThumbnailClick={setCurrentImageIndex}
            />
            
            {/* Description */}
            <PrizeDescription 
              description={prize.description || ''}
              detail={prize.detail}
            />
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button 
            className="w-full bg-rifa-purple hover:bg-rifa-darkPurple text-white" 
            onClick={onClose}
          >
            Volver XXX
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrizeDetailModal;
