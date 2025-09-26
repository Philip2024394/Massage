import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { indonesianCities } from '../data/indonesianCities';

interface CitySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CitySelector = forwardRef<HTMLDivElement, CitySelectorProps>(({ value, onChange }, ref) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredCities = indonesianCities.filter(city =>
    city.toLowerCase().includes(inputValue?.toLowerCase() || '')
  ).slice(0, 7);

  const handleSelectCity = (city: string) => {
    onChange(city);
    setInputValue(city);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Allow free text entry
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const currentRef = ref as React.RefObject<HTMLDivElement>;
      if (currentRef && currentRef.current && !currentRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  return (
    <div className="relative w-full" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={inputValue || ''}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="e.g., Jakarta, Surabaya..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="absolute right-0 top-0 h-full px-3 flex items-center">
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <AnimatePresence>
        {isOpen && filteredCities.length > 0 && inputValue && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredCities.map(city => (
              <li
                key={city}
                onClick={() => handleSelectCity(city)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              >
                {city}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
});
