
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
import { Prize, PrizeImage, Organization } from '@/lib/constants/types';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ImageCarousel from './prize-detail/ImageCarousel';
import MobileCarousel from './prize-detail/MobileCarousel';
import ThumbnailGallery from './prize-detail/ThumbnailGallery';
import PrizeDescription from './prize-detail/PrizeDescription';
import PromotionalImage from './raffle/PromotionalImage';

interface PrizeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prize: Prize | null;
  prizeImages: PrizeImage[];
  organization?: Organization | null;
}

const PrizeDetailModal: React.FC<PrizeDetailModalProps> = ({ isOpen, onClose, prize, prizeImages, organization }) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  
  // Use either url_image or image_url depending on what's available
  const relevantImages = React.useMemo(() => {
    if (!prize || !prizeImages.length) return [];
    
    const filteredImages = prizeImages
      .filter(img => prize && img.prize_id === prize.id)
      .map(img => ({
        ...img,
        displayUrl: img.url_image || img.image_url
      }));
      
    console.log(`Found ${filteredImages.length} images for prize ${prize?.name}:`, 
      filteredImages.map(img => img.displayUrl));
    
    return filteredImages;
  }, [prize, prizeImages]);

  // Reset current image index when prize changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [prize]);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : relevantImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < relevantImages.length - 1 ? prev + 1 : 0));
  };

  // Main image to display (from prize images or prize.url_image)
  const mainImageUrl = relevantImages.length > 0 
    ? relevantImages[currentImageIndex]?.displayUrl 
    : prize?.url_image;

  console.log("Prize Detail Modal - Main image URL:", mainImageUrl);
  console.log("Relevant images count:", relevantImages.length);

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
          <DialogTitle className="text-xl font-bold text-center">
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

            {/* Display promotional image at the end if available */}
            {organization?.imagen_publicitaria && (
              <div className="mt-6">
                <PromotionalImage imageUrl={organization.imagen_publicitaria} />
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button 
            className="w-full bg-rifa-purple hover:bg-rifa-darkPurple text-white" 
            onClick={onClose}
          >
            Volver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrizeDetailModal;
