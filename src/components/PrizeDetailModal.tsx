
import React, { useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface PrizeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prize: Prize | null;
  prizeImages: PrizeImage[];
}

const PrizeDetailModal: React.FC<PrizeDetailModalProps> = ({ isOpen, onClose, prize, prizeImages }) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [filteredImages, setFilteredImages] = React.useState<PrizeImage[]>([]);
  
  console.log("▶️ PrizeDetailModal.tsx: Abriendo modal con premio:", prize?.name, "y", prizeImages.length, "imágenes");
  
  // Reset current image index when prize changes
  useEffect(() => {
    setCurrentImageIndex(0);
    console.log("▶️ PrizeDetailModal.tsx: Reiniciando índice de imagen para nuevo premio:", prize?.name);
    
    // Filter images for the current prize
    if (prize) {
      const relevantImages = prizeImages.filter(img => img.prize_id === prize.id);
      console.log(`▶️ PrizeDetailModal.tsx: Filtradas ${relevantImages.length} imágenes para premio ${prize.id}`);
      
      if (relevantImages.length === 0 && prize.url_image) {
        // Create a fallback using the prize's own image
        setFilteredImages([{
          id: 'default',
          prize_id: prize.id,
          image_url: prize.url_image,
          url_image: prize.url_image,
          displayUrl: prize.url_image
        }]);
        console.log("▶️ PrizeDetailModal.tsx: Usando imagen predeterminada del premio:", prize.url_image);
      } else {
        // Map images to include display URL
        setFilteredImages(relevantImages.map(img => ({
          ...img,
          displayUrl: img.url_image || img.image_url
        })));
        console.log("▶️ PrizeDetailModal.tsx: URLs de imágenes filtradas:", 
          relevantImages.map(img => img.url_image || img.image_url));
      }
    } else {
      setFilteredImages([]);
    }
  }, [prize, prizeImages]);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => {
      const newIndex = prev > 0 ? prev - 1 : filteredImages.length - 1;
      console.log("▶️ PrizeDetailModal.tsx: Moviendo a imagen anterior, índice:", newIndex);
      return newIndex;
    });
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => {
      const newIndex = prev < filteredImages.length - 1 ? prev + 1 : 0;
      console.log("▶️ PrizeDetailModal.tsx: Moviendo a siguiente imagen, índice:", newIndex);
      return newIndex;
    });
  };

  // Main image to display
  const mainImageUrl = filteredImages.length > 0 
    ? filteredImages[currentImageIndex]?.displayUrl 
    : prize?.url_image;

  console.log("▶️ PrizeDetailModal.tsx: URL de imagen principal:", mainImageUrl);
  console.log("▶️ PrizeDetailModal.tsx: Índice actual de imagen:", currentImageIndex, "de", filteredImages.length);

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
              images={filteredImages}
              currentIndex={currentImageIndex}
              onPrev={handlePrevImage}
              onNext={handleNextImage}
              imageTitle={prize.name}
            />
            
            {/* Embla Carousel for mobile devices */}
            <MobileCarousel 
              images={filteredImages}
              fallbackImage={prize.url_image}
              imageTitle={prize.name}
              currentIndex={currentImageIndex}
              onSlideChange={setCurrentImageIndex}
            />
            
            {/* Thumbnail gallery for multiple images - visible on both mobile and desktop */}
            <ThumbnailGallery 
              images={filteredImages}
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
            Volver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrizeDetailModal;
