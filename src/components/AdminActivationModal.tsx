import React, { useState } from 'react';
import { X, Key, Loader, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entityName: string;
}

export const AdminActivationModal: React.FC<AdminActivationModalProps> = ({ isOpen, onClose, onConfirm, entityName }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md w-full">
            <div className="bg-white px-6 pt-6 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-primary-600" />
                  Confirm Activation
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                You are about to activate the account for <span className="font-semibold text-gray-800">{entityName}</span> for a period of <span className="font-semibold text-gray-800">1 month</span>.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Do you want to proceed?
              </p>
              <div className="flex justify-end items-center gap-4">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader className="animate-spin h-4 w-4" />}
                  {loading ? 'Activating...' : 'Confirm & Activate'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
