
import React, { useRef, useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PrizeImage from './PrizeImage';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import DebugModal from '../DebugModal';

interface MobileCarouselProps {
  images: { displayUrl: string }[];
  fallbackImage?: string;
  imageTitle: string;
  currentIndex?: number;
  onSlideChange?: (index: number) => void;
}

const MobileCarousel: React.FC<MobileCarouselProps> = ({ 
  images, 
  fallbackImage,
  imageTitle,
  currentIndex = 0,
  onSlideChange
}) => {
  const isMobile = useIsMobile();
  const carouselApiRef = useRef<any>(null);
  const lastIndexRef = useRef<number>(currentIndex);
  const [debugMode, setDebugMode] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  
  console.log("▶️ MobileCarousel.tsx: Renderizando con", images.length, "imágenes");
  
  // Check for debug mode
  useEffect(() => {
    const checkDebugMode = async () => {
      try {
        const { data } = await supabase
          .from('organization')
          .select('modal')
          .limit(1)
          .single();
        
        setDebugMode(data?.modal === 'programador');
      } catch (error) {
        console.error('▶️ MobileCarousel.tsx: Error al verificar modo debug:', error);
      }
    };
    
    checkDebugMode();
  }, []);
  
  // Function to handle API setup
  const handleApiChange = (api: any) => {
    console.log("▶️ MobileCarousel.tsx: API de carrusel inicializada");
    carouselApiRef.current = api;
    
    // Add event listener for slide changes
    if (api && onSlideChange) {
      api.on('select', () => {
        const index = api.selectedScrollSnap();
        console.log("▶️ MobileCarousel.tsx: Cambio de slide a índice:", index);
        
        if (index !== lastIndexRef.current) {
          lastIndexRef.current = index;
          onSlideChange(index);
        }
      });
    }
  };
  
  // Update carousel position when currentIndex changes externally
  useEffect(() => {
    if (carouselApiRef.current && lastIndexRef.current !== currentIndex) {
      console.log("▶️ MobileCarousel.tsx: Actualizando posición a índice:", currentIndex);
      carouselApiRef.current.scrollTo(currentIndex);
      lastIndexRef.current = currentIndex;
    }
  }, [currentIndex]);
  
  // If no images, display fallback or nothing
  if ((!images || images.length === 0) && !fallbackImage) {
    console.log("▶️ MobileCarousel.tsx: No hay imágenes para mostrar");
    return null;
  }
  
  // Prepare array with fallback if needed
  const displayImages = images.length > 0 
    ? images 
    : fallbackImage 
      ? [{ displayUrl: fallbackImage }] 
      : [];
      
  console.log("▶️ MobileCarousel.tsx: Mostrando carrusel con", displayImages.length, "imágenes");
  
  if (displayImages.length === 0) {
    return null;
  }
  
  // Create debug button and modal if in debug mode
  const renderDebugButton = () => {
    if (debugMode) {
      return (
        <>
          <button 
            className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-20"
            onClick={() => {
              setDebugData({
                images: displayImages,
                currentIndex,
                fallbackImage,
                isMobileView: isMobile
              });
              setIsDebugModalOpen(true);
            }}
          >
            Debug
          </button>
          
          <DebugModal
            isOpen={isDebugModalOpen}
            onClose={() => setIsDebugModalOpen(false)}
            data={debugData}
            title="Datos del Carrusel Móvil"
          />
        </>
      );
    }
    return null;
  };

  return (
    <div className="relative mb-6 block md:hidden">
      {renderDebugButton()}
      
      <Carousel 
        setApi={handleApiChange}
        opts={{
          align: "center",
          loop: displayImages.length > 1
        }}
        className="w-full"
      >
        <CarouselContent>
          {displayImages.map((image, index) => (
            <CarouselItem key={index} className="flex justify-center">
              <div className="w-full h-[300px] overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <PrizeImage
                  src={image.displayUrl}
                  alt={`${imageTitle} - ${index + 1}`}
                  className="h-full object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {displayImages.length > 1 && (
          <>
            <CarouselPrevious className="left-1" />
            <CarouselNext className="right-1" />
          </>
        )}
        
        {/* Pagination indicators */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {displayImages.map((_, index) => (
              <div 
                key={index}
                className={`h-2 w-2 rounded-full cursor-pointer ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => {
                  if (carouselApiRef.current) {
                    carouselApiRef.current.scrollTo(index);
                  }
                }}
              />
            ))}
          </div>
        )}
      </Carousel>
    </div>
  );
};

export default MobileCarousel;
