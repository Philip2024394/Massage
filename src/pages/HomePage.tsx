import React from 'react';
import { Header } from '../components/Header';
import { FilterBar } from '../components/FilterBar';
import { SwipeableCards } from '../components/SwipeableCards';
import { FilterOptions, AuthInfo, TherapistProfile, MassagePlaceProfile } from '../types';
import { PlaceCard } from '../components/PlaceCard';
import { useTranslation } from '../hooks/useTranslation';

interface HomePageProps {
  authInfo: AuthInfo | null;
  onLogin: (code: string) => Promise<string | void>;
  onLogout: () => void;
  filteredTherapists: TherapistProfile[];
  filteredPlaces: MassagePlaceProfile[];
  filters: FilterOptions;
  onlineCount: number;
  totalCount: number;
  openPlacesCount: number;
  totalPlacesCount: number;
  onFiltersChange: (filters: FilterOptions) => void;
  onWhatsAppClick: (phone: string, name: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  authInfo,
  onLogin,
  onLogout,
  filteredTherapists,
  filteredPlaces,
  filters,
  onlineCount,
  totalCount,
  openPlacesCount,
  totalPlacesCount,
  onFiltersChange,
  onWhatsAppClick,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Header authInfo={authInfo} onLogin={onLogin} onLogout={onLogout} />
      
      <FilterBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        onlineCount={onlineCount}
        totalCount={totalCount}
        openPlacesCount={openPlacesCount}
        totalPlacesCount={totalPlacesCount}
      />
      
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filters.serviceType === 'home' ? (
          <div className="w-full max-w-md mx-auto">
            <SwipeableCards
              therapists={filteredTherapists}
              onWhatsAppClick={onWhatsAppClick}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaces.map(place => (
              <PlaceCard 
                key={place.id}
                place={place}
                onWhatsAppClick={onWhatsAppClick}
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
    </>
  );
};
