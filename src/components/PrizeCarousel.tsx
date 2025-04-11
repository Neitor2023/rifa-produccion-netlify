
import React from 'react';
import { Prize } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card } from '@/components/ui/card';
import SafeImage from '@/components/SafeImage';

interface PrizeCarouselProps {
  prizes: Prize[];
  onViewDetails: (prize: Prize) => void;
}

const PrizeCarousel: React.FC<PrizeCarouselProps> = ({ prizes, onViewDetails }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Debug logging for prize images
  React.useEffect(() => {
    if (prizes && prizes.length > 0) {
      console.log("Prize images in carousel:", prizes.map(p => ({ id: p.id, name: p.name, url: p.url_image })));
    }
  }, [prizes]);

  return (
    <div className="relative mb-8">
      {prizes.length > 1 && (
        <>
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide gap-4 py-4 px-2 snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {prizes.map((prize) => (
          <div key={prize.id} className="min-w-[280px] max-w-[320px] snap-center bg-transparent">
            <Card 
              className="overflow-hidden cursor-pointer relative" 
              onClick={() => onViewDetails(prize)}
            >
              <div className="relative">
                <AspectRatio ratio={4/3}>
                  <SafeImage 
                    src={prize.url_image} 
                    alt={prize.name}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
                
                {/* Button always visible */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                  <Button 
                    variant="secondary"
                    className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrizeCarousel;
