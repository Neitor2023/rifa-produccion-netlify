
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
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SafeImage from '@/components/SafeImage';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface PrizeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prize: Prize | null;
  prizeImages: PrizeImage[];
}

const PrizeDetailModal: React.FC<PrizeDetailModalProps> = ({ isOpen, onClose, prize, prizeImages }) => {
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
      
    console.log(`Found ${filteredImages.length} images for prize ${prize.name}:`, 
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
          <DialogTitle className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">
            {prize.name}
          </DialogTitle>
        </DialogHeader>
        
        {/* ScrollArea to enable scrolling for long content */}
        <ScrollArea className="flex-1 overflow-y-auto px-1">
          <div className="py-4">
            {/* Image carousel - Standard layout for larger displays */}
            <div className="relative mb-6 hidden md:block">
              <div className="w-full h-64 md:h-80 overflow-hidden rounded-lg">
                <SafeImage 
                  src={mainImageUrl} 
                  alt={prize.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {relevantImages.length > 1 && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full dark:bg-gray-800/80 dark:hover:bg-gray-700"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full dark:bg-gray-800/80 dark:hover:bg-gray-700"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {relevantImages.map((_, index) => (
                      <div 
                        key={index}
                        className={`h-2 w-2 rounded-full cursor-pointer ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Embla Carousel for mobile devices */}
            <div className="md:hidden mb-6">
              <Carousel className="w-full">
                <CarouselContent>
                  {relevantImages.length > 0 ? 
                    relevantImages.map((image, index) => (
                      <CarouselItem key={index} className="pl-0">
                        <div className="p-1">
                          <div className="h-60 overflow-hidden rounded-lg">
                            <SafeImage
                              src={image.displayUrl}
                              alt={`${prize.name} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </CarouselItem>
                    )) : 
                    <CarouselItem>
                      <div className="p-1">
                        <div className="h-60 overflow-hidden rounded-lg">
                          <SafeImage 
                            src={prize.url_image} 
                            alt={prize.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  }
                </CarouselContent>
                {relevantImages.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            </div>
            
            {/* Thumbnail gallery for multiple images - visible on both mobile and desktop */}
            {relevantImages.length > 1 && (
              <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
                {relevantImages.map((image, index) => (
                  <div 
                    key={index}
                    className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 ${
                      index === currentImageIndex ? 'border-blue-500 dark:border-blue-400' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <SafeImage 
                      src={image.displayUrl} 
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Description */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{prize.description}</p>
              </div>
              
              {prize.detail && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Detalles</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{prize.detail}</p>
                </div>
              )}
            </div>
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
