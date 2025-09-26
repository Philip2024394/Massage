import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

export interface PlaceDetails {
  address: string;
  city: string;
  lat: number;
  lng: number;
}

interface LocationSearchInputProps {
  onPlaceSelected: (details: PlaceDetails) => void;
}

const DEBOUNCE_DELAY = 300;

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({ onPlaceSelected }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('google-maps-proxy', {
        body: { input },
      });

      if (functionError) throw functionError;
      
      if (data.error) {
        throw new Error(data.error);
      } else if (data.status === 'OK') {
        setSuggestions(data.predictions);
      } else if (data.error_message) {
        throw new Error(data.error_message);
      }
    } catch (err: any) {
      console.error('Failed to fetch suggestions:', err);
      setError(err.message || 'Failed to connect to location service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(query);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [query, fetchSuggestions]);

  const handleSelect = async (placeId: string) => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setQuery('');
    try {
      const { data, error: functionError } = await supabase.functions.invoke('google-maps-proxy', {
        body: { placeId },
      });

      if (functionError) throw functionError;

      if (data.error) {
        throw new Error(data.error);
      } else if (data.status === 'OK') {
        const { address_components, geometry, formatted_address } = data.result;
        const cityComponent = address_components.find((c: any) => c.types.includes('administrative_area_level_2') || c.types.includes('administrative_area_level_1'));
        const city = cityComponent ? cityComponent.long_name.replace('Kota ', '').replace('Kabupaten ', '') : 'Unknown';
        
        onPlaceSelected({
          address: formatted_address,
          city: city,
          lat: geometry.location.lat,
          lng: geometry.location.lng,
        });
      } else {
        throw new Error(data.error_message || 'Failed to get place details.');
      }
    } catch (err: any) {
      console.error('Failed to fetch place details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an address..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? <Loader className="h-5 w-5 text-gray-400 animate-spin" /> : 
           query && <button type="button" onClick={() => setQuery('')}><X className="h-5 w-5 text-gray-400" /></button>}
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map(suggestion => (
              <li
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion.place_id)}
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-sm"
              >
                {suggestion.description}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
