import React, { useState, useRef, useEffect } from 'react';
import { Users, Star, ChevronDown, Store, Home } from 'lucide-react';
import { FilterOptions } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { massageTypeKeys } from '../data/services';

interface FilterBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onlineCount: number;
  totalCount: number;
  openPlacesCount: number;
  totalPlacesCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  filters, 
  onFiltersChange, 
  onlineCount, 
  totalCount,
  openPlacesCount,
  totalPlacesCount
}) => {
  const { t } = useTranslation();
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeToggle = (typeKey: string) => {
    const newTypes = filters.massageTypes.includes(typeKey)
      ? filters.massageTypes.filter(t => t !== typeKey)
      : [...filters.massageTypes, typeKey];
    onFiltersChange({ ...filters, massageTypes: newTypes });
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-100 p-4 w-full">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-2 text-gray-600">
            {filters.serviceType === 'home' ? <Users className="h-4 w-4" /> : <Store className="h-4 w-4" />}
            <span className="text-sm">
              {filters.serviceType === 'home' 
                ? t('filterBar.onlineCount', { onlineCount, totalCount })
                : t('filterBar.placesOpenCount', { openCount: openPlacesCount, totalCount: totalPlacesCount })
              }
            </span>
          </div>
          <div className="flex items-center bg-gray-100 rounded-full p-1">
            <button onClick={() => onFiltersChange({ ...filters, serviceType: 'home' })} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.serviceType === 'home' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
              <Home className="h-4 w-4" />
              {t('filterBar.homeService')}
            </button>
            <button onClick={() => onFiltersChange({ ...filters, serviceType: 'places' })} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.serviceType === 'places' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
              <Store className="h-4 w-4" />
              {t('filterBar.massagePlaces')}
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <span>
                {filters.massageTypes.length > 0
                  ? t('filterBar.typesSelected', { count: filters.massageTypes.length })
                  : t('filterBar.massageType')}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showTypeDropdown && (
              <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-800">{t('filterBar.selectMassageTypes')}</h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {massageTypeKeys.map((key) => (
                      <label key={key} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.massageTypes.includes(key)}
                          onChange={() => handleTypeToggle(key)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{t(key)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-2 p-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <button 
                        onClick={() => onFiltersChange({...filters, massageTypes: []})}
                        className="text-sm text-primary-600 hover:underline"
                    >
                        {t('filterBar.clearSelection')}
                    </button>
                    <button
                        onClick={() => setShowTypeDropdown(false)}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium bg-primary-500 text-white hover:bg-primary-600"
                    >
                      <span>{t('filterBar.closeDropdown')}</span>
                    </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="font-medium text-gray-700">{t('filterBar.rating')} {filters.minRating}+</span>
          </button>
        </div>
      </div>
    </div>
  );
};
