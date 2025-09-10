import React from 'react';
import { Header } from '../components/Header';
import { FilterBar } from '../components/FilterBar';
import { SwipeableCards } from '../components/SwipeableCards';
import { UserLocation, FilterOptions, User } from '../types';
import { PlaceCard } from '../components/PlaceCard';
import { useTranslation } from '../hooks/useTranslation';

interface HomePageProps {
  userLocation: UserLocation | null;
  currentUser: User | null;
  filteredTherapistIds: string[];
  filteredPlaceIds: string[];
  filters: FilterOptions;
  onlineCount: number;
  totalCount: number;
  openPlacesCount: number;
  totalPlacesCount: number;
  onAuthClick: () => void;
  onLogout: () => void;
  onFiltersChange: (filters: FilterOptions) => void;
  onWhatsAppClick: (phone: string, name: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  filteredTherapistIds,
  filteredPlaceIds,
  filters,
  onlineCount,
  totalCount,
  openPlacesCount,
  totalPlacesCount,
  onAuthClick,
  onLogout,
  onFiltersChange,
  onWhatsAppClick,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Header
        currentUser={currentUser}
        onAuthClick={onAuthClick}
        onLogout={onLogout}
      />
      
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
              therapistIds={filteredTherapistIds}
              onWhatsAppClick={onWhatsAppClick}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaceIds.map(placeId => (
              <PlaceCard 
                key={placeId}
                placeId={placeId}
                onWhatsAppClick={onWhatsAppClick}
              />
            ))}
             {filteredPlaceIds.length === 0 && (
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
