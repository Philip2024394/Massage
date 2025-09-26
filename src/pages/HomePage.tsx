import React from 'react';
import { Header } from '../components/Header';
import { FilterBar } from '../components/FilterBar';
import { SwipeableCards } from '../components/SwipeableCards';
import { FilterOptions, TherapistProfile, MassagePlaceProfile } from '../types';
import { PlaceCard } from '../components/PlaceCard';
import { useTranslation } from '../hooks/useTranslation';
import { Footer } from '../components/Footer';
import { getWhatsAppUrl } from '../utils/location';

interface HomePageProps {
  filteredTherapists: TherapistProfile[];
  filteredPlaces: MassagePlaceProfile[];
  filters: FilterOptions;
  onlineCount: number;
  totalCount: number;
  openPlacesCount: number;
  totalPlacesCount: number;
  onFiltersChange: (filters: FilterOptions) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  filteredTherapists,
  filteredPlaces,
  filters,
  onlineCount,
  totalCount,
  openPlacesCount,
  totalPlacesCount,
  onFiltersChange,
  searchQuery,
  onSearchQueryChange,
}) => {
  const { t } = useTranslation();

  const handleWhatsAppClick = (phone: string, name: string) => {
    window.open(getWhatsAppUrl(phone, `Hi ${name}`), '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <FilterBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        onlineCount={onlineCount}
        totalCount={totalCount}
        openPlacesCount={openPlacesCount}
        totalPlacesCount={totalPlacesCount}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
      />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filters.serviceType === 'home' ? (
          <div className="w-full max-w-md mx-auto">
            <SwipeableCards
              therapists={filteredTherapists}
              onWhatsAppClick={handleWhatsAppClick}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaces.map(place => (
              <PlaceCard 
                key={place.id}
                place={place}
                onWhatsAppClick={handleWhatsAppClick}
              />
            ))}
             {filteredPlaces.length === 0 && (
              <div className="col-span-full flex items-center justify-center h-96 w-full">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('swipeable.noTherapists')}</h3>
                  <p className="text-gray-600">{t('swipeable.adjustFilters')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
