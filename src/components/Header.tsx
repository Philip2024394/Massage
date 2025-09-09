import React from 'react';
import { User as UserIcon, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from './Logo';

interface HeaderProps {
  currentUser: User | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  onAuthClick, 
  onLogout 
}) => {
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/home">
              <Logo layout="horizontal" className="h-10 w-auto" />
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {currentUser.userType === 'admin' ? (
                  <Link
                    to="/admin-dashboard"
                    className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('header.adminPanel')}</span>
                  </Link>
                ) : (
                  <Link
                    to="/therapist-dashboard"
                    className="flex items-center space-x-2 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('header.therapistDashboard')}</span>
                  </Link>
                )}
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 hidden md:block">
                    {currentUser.name}
                  </span>
                  <button
                    onClick={onLogout}
                    className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                    title={t('header.logout')}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                title={t('header.therapistLogin')}
              >
                <UserIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
