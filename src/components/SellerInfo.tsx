
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone } from 'lucide-react';
import SafeImage from '@/components/SafeImage';

interface SellerInfoProps {
  name: string;
  phone: string;
  avatar?: string;
  id: string;
}

const SellerInfo: React.FC<SellerInfoProps> = ({ name, phone, avatar, id }) => {
  return (
    <Card className="mb-8">
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">Información del Vendedor</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
            {avatar ? (
              <SafeImage 
                src={avatar} 
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-medium">{name}</h3>
            <div className="flex items-center text-sm mt-1">
              <Phone className="h-4 w-4 mr-1" />
              <span>{phone}</span>
            </div>
            <p className="text-xs mt-1">Vendedor ID: {id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerInfo;
