import React from 'react';
import { Header } from '../components/Header';
import { FilterBar } from '../components/FilterBar';
import { SwipeableCards } from '../components/SwipeableCards';
import { TherapistProfile, UserLocation, FilterOptions, User } from '../types';

interface HomePageProps {
  userLocation: UserLocation | null;
  currentUser: User | null;
  filteredTherapists: TherapistProfile[];
  filters: FilterOptions;
  onlineCount: number;
  totalCount: number;
  onAuthClick: () => void;
  onLogout: () => void;
  onFiltersChange: (filters: FilterOptions) => void;
  onWhatsAppClick: (phone: string, name: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  filteredTherapists,
  filters,
  onlineCount,
  totalCount,
  onAuthClick,
  onLogout,
  onFiltersChange,
  onWhatsAppClick,
}) => {
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
      />
      
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md mx-auto">
          <SwipeableCards
            therapists={filteredTherapists}
            onWhatsAppClick={onWhatsAppClick}
          />
        </div>
      </main>
    </>
  );
};
