
import React from 'react';
import { Prize } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardFooter } from '@/components/ui/card';
import SafeImage from '@/components/SafeImage';

interface PrizeCardProps {
  prize: Prize;
  onViewDetails: (prize: Prize) => void;
}

const PrizeCard: React.FC<PrizeCardProps> = ({ prize, onViewDetails }) => {
  // Debug logging
  React.useEffect(() => {
    console.log(`PrizeCard - Prize: ${prize.name}, Image URL: ${prize.url_image}`);
  }, [prize]);

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Using 4:5 aspect ratio as specified */}
        <AspectRatio ratio={4/5}>
          <SafeImage 
            src={prize.url_image} 
            alt={prize.name}
            className="w-full h-full object-contain"
          />
        </AspectRatio>
      </div>
      
      {/* Button below image */}
      <CardFooter className="w-4 p-3 flex justify-center">
        <Button 
          variant="secondary"
          className="w-full hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => onViewDetails(prize)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalles
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PrizeCard;
