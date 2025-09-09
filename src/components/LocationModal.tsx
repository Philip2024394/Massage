import React, { useState } from 'react';
import { X, MapPin, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserLocation } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { getCurrentLocation } from '../utils/location';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (location: UserLocation) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onLocationSet
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await getCurrentLocation();
      const location: UserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address: t('header.currentLocation')
      };
      onLocationSet(location);
      onClose();
    } catch (err: any) {
      let errorMessage = t('locationModal.error');
      if (err.code) {
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = t('locationModal.errors.permissionDenied');
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = t('locationModal.errors.positionUnavailable');
            break;
          case 3: // TIMEOUT
            errorMessage = t('locationModal.errors.timeout');
            break;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLocation = () => {
    const location: UserLocation = {
      lat: 37.7749,
      lng: -122.4194,
      address: 'San Francisco, CA'
    };
    onLocationSet(location);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-gray-500 bg-opacity-75" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full"
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{t('locationModal.title')}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">{t('locationModal.description')}</p>
              {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>}
              <div className="space-y-3">
                <button onClick={handleGetCurrentLocation} disabled={loading} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50">
                  {loading ? <Loader className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                  <span>{loading ? t('locationModal.gettingLocation') : t('locationModal.useCurrentLocation')}</span>
                </button>
                <button onClick={handleManualLocation} className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  {t('locationModal.useDemoLocation')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
