import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full text-center py-8 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center space-x-4">
          <Link to="/terms" className="text-xs sm:text-sm text-gray-500 hover:text-primary-600 hover:underline whitespace-nowrap">
            Terms of Service
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/agent-signup" className="text-xs sm:text-sm text-gray-500 hover:text-primary-600 hover:underline whitespace-nowrap">
            2Go Agent
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          © {new Date().getFullYear()} 2Go Massage. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
