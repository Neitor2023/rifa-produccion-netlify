
import React from 'react';
import { Input } from '@/components/ui/input';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const PhoneInputField: React.FC<PhoneInputFieldProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="phone" className="text-black dark:text-white text-sm font-medium">
        Ingrese su número aqui:
      </label>
      <Input
        id="phone"
        placeholder="+593 987 654 321 o 1702030405"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background dark:bg-gray-700 text-foreground dark:text-white"
      />
    </div>
  );
};

export default PhoneInputField;
