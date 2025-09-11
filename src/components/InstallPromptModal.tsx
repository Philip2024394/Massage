import React from 'react';
import { X, Smartphone, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md w-full">
            <div className="bg-white px-6 pt-6 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Smartphone />
                  Install App
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              <div className="space-y-4 text-gray-600 text-sm">
                <p>For quick access, add this app to your home screen.</p>
                <div>
                  <h4 className="font-semibold text-gray-800">On iOS (Safari):</h4>
                  <p>Tap the 'Share' button, then scroll down and tap 'Add to Home Screen'.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">On Android (Chrome):</h4>
                  <p>Tap the three-dot menu, then tap 'Install app' or 'Add to Home screen'.</p>
                </div>
              </div>
               <button onClick={onClose} className="w-full mt-6 bg-primary-500 text-white py-2.5 px-4 rounded-lg hover:bg-primary-600 font-medium">
                  Got it!
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
