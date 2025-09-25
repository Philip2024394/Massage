import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Store, Home, Map, Search } from 'lucide-react';
import { FilterOptions } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { massageTypeKeys, placeServiceKeys } from '../data/services';
import { indonesianCities } from '../data/indonesianCities';

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
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
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

  const handleCityChange = (city: string) => {
    onFiltersChange({ ...filters, city: city });
    setShowCityDropdown(false);
  };

  const serviceKeysToDisplay = filters.serviceType === 'home' ? massageTypeKeys : placeServiceKeys;
  const citiesToShow = ["All Cities", ...indonesianCities].filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

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
          <div className="relative" ref={cityDropdownRef}>
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <Map className="h-4 w-4 text-gray-600" />
              <span>{filters.city || 'All Cities'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showCityDropdown && (
              <div className="absolute top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search city..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border-0 focus:ring-0 text-sm"
                      autoFocus
                    />
                  </div>
                </div>
                <ul className="max-h-72 overflow-y-auto">
                  {citiesToShow.map((city) => (
                    <li key={city}>
                      <button
                        onClick={() => handleCityChange(city === 'All Cities' ? '' : city)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {city}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="relative" ref={typeDropdownRef}>
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
                    {serviceKeysToDisplay.map((key) => (
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
        </div>
      </div>
    </div>
  );
};
