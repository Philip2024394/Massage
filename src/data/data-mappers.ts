import { TherapistProfile, MassagePlaceProfile, Review } from '../types';
import { Tables } from '../types/supabase';

export const mapSupabaseTherapistToProfile = (therapist: Tables<'therapists'>): TherapistProfile => ({
  id: therapist.id,
  accountNumber: therapist.account_number || '',
  name: therapist.name || '',
  profileImageUrl: therapist.profile_image_url || '',
  rating: therapist.rating || 0,
  reviewCount: therapist.review_count || 0,
  specialties: therapist.specialties || [],
  bio: therapist.bio || '',
  experience: therapist.experience || 0,
  isOnline: therapist.is_online || false,
  status: therapist.status || 'pending',
  location: {
    lat: Number(therapist.lat) || 0,
    lng: Number(therapist.lng) || 0,
    city: therapist.city || '',
  },
  pricing: {
    session60: therapist.pricing_session_60 || 0,
    session90: therapist.pricing_session_90 || 0,
    session120: therapist.pricing_session_120 || 0,
  },
  massageTypes: therapist.massage_types || [],
  phone: therapist.phone || '',
  languages: therapist.languages || [],
  certifications: therapist.certifications || [],
});

export const mapSupabasePlaceToProfile = (place: Tables<'places'>): MassagePlaceProfile => ({
  id: place.id,
  accountNumber: place.account_number || '',
  name: place.name || '',
  profileImageUrl: place.profile_image_url || '',
  rating: place.rating || 0,
  reviewCount: place.review_count || 0,
  address: place.address || '',
  city: place.city || '',
  location: {
    lat: Number(place.lat) || 0,
    lng: Number(place.lng) || 0,
  },
  phone: place.phone || '',
  services: place.services || [],
  isOnline: place.is_online || false,
  status: place.status || 'pending',
});

export const mapSupabaseReviewToAppReview = (review: Tables<'reviews'>): Review => ({
    id: review.id,
    targetId: review.target_id,
    targetType: review.target_type,
    customerName: review.customer_name,
    customerWhatsApp: review.customer_whatsapp || '',
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.created_at,
});
