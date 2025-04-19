
import React from 'react';
import { Input } from '@/components/ui/input';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const PhoneInputField: React.FC<PhoneInputFieldProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="phone" className="text-sm font-medium">
        Número de teléfono
      </label>
      <Input
        id="phone"
        placeholder="+593 123 456 789"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default PhoneInputField;
