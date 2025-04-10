
import React from 'react';
import { Prize } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

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
          <Card key={prize.id} className="min-w-[280px] max-w-[320px] snap-center prize-card bg-white dark:bg-gray-800">
            <CardContent className="p-0">
              <div className="relative">
                <img 
                  src={prize.url_image} 
                  alt={prize.name} 
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-lg" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h3 className="font-bold text-lg">{prize.name}</h3>
                </div>
              </div>
              <div className="p-4 flex justify-center">
                <Button 
                  variant="outline" 
                  className="border-rifa-purple text-rifa-purple hover:bg-rifa-purple hover:text-white transition-colors dark:text-rifa-lightPurple dark:border-rifa-lightPurple dark:hover:bg-rifa-darkPurple"
                  onClick={() => onViewDetails(prize)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PrizeCarousel;
