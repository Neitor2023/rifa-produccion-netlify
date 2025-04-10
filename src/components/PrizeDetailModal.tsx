
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Prize, PrizeImage } from '@/lib/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    return prizeImages
      .filter(img => prize && img.prize_id === prize.id)
      .map(img => ({
        ...img,
        displayUrl: img.url_image || img.image_url
      }));
  }, [prize, prizeImages]);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : relevantImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < relevantImages.length - 1 ? prev + 1 : 0));
  };

  if (!prize) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">
            {prize.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {/* Image carousel */}
          <div className="relative mb-6">
            <div className="w-full h-64 md:h-80 overflow-hidden rounded-lg">
              <img 
                src={relevantImages.length > 0 
                  ? (relevantImages[currentImageIndex].displayUrl) 
                  : prize.url_image
                } 
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
          
          {/* Description */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</h3>
              <p className="text-gray-700 dark:text-gray-300">{prize.description}</p>
            </div>
            
            {prize.detail && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Detalles</h3>
                <p className="text-gray-700 dark:text-gray-300">{prize.detail}</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
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
