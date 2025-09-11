export interface TherapistProfile {
  id: string;
  login_code: string;
  accountNumber: string;
  name: string;
  profileImageUrl: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  bio: string;
  experience: number;
  isOnline: boolean;
  status: 'active' | 'pending' | 'blocked';
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
  };
  distance?: number;
  pricing: {
    session60: number;
    session90: number;
    session120: number;
  };
  massageTypes: string[];
  phone: string;
  languages: string[];
  certifications: string[];
}

export interface DayHours {
  open: string | null;
  close: string | null;
}

export type OpeningHours = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};

export interface MassagePlaceProfile {
  id: string;
  login_code: string;
  accountNumber: string;
  name: string;
  profileImageUrl: string;
  galleryImageUrls: string[];
  rating: number;
  reviewCount: number;
  address: string;
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;
  phone: string;
  services: string[];
  languages: string[];
  pricing: {
    session60: number;
    session90: number;
    session120: number;
  };
  openingHours: OpeningHours | null;
  isOpen: boolean;
  status: 'active' | 'pending' | 'blocked';
}

export type TherapistFilterData = {
  id: string;
  is_online: boolean;
  massage_types: string[] | null;
  rating: number;
  lat: number | null;
  lng: number | null;
  distance?: number;
};

export type PlaceFilterData = {
  id: string;
  is_online: boolean;
  services: string[] | null;
  rating: number;
  lat: number | null;
  lng: number | null;
  distance?: number;
};

export interface UserLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface FilterOptions {
  serviceType: 'home' | 'places';
  onlineOnly: boolean;
  massageTypes: string[];
  maxDistance: number;
  minRating: number;
  priceRange: {
    min: number;
    max: number;
  };
}

export type Language = 'en' | 'id';

export interface Review {
  id: string;
  targetId: string;
  targetType: 'therapist' | 'place';
  customerName: string;
  customerWhatsApp: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AuthInfo {
  code: string;
  type: 'therapist' | 'place' | 'admin';
}
