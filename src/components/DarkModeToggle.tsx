
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Toggle } from '@/components/ui/toggle';

const DarkModeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const toggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <Toggle
      pressed={theme === 'dark'}
      onPressedChange={toggleDarkMode}
      aria-label="Toggle dark mode"
      className="rounded-full w-10 h-10 p-0 bg-white/90 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Cambiar modo</span>
    </Toggle>
  );
};

export default DarkModeToggle;
