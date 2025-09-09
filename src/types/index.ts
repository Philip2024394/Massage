export interface TherapistProfile {
  id: string;
  name: string;
  email: string;
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
  therapistNumber: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface FilterOptions {
  onlineOnly: boolean;
  massageTypes: string[];
  maxDistance: number;
  minRating: number;
  priceRange: {
    min: number;
    max: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'therapist' | 'admin';
  profileImage?: string;
}

export type Language = 'en' | 'id';

export interface Review {
  id: string;
  therapistId: string;
  customerName: string;
  customerWhatsApp: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
