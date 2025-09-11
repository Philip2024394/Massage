import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Key, LayoutDashboard, LogOut, Download } from 'lucide-react';
import { AuthInfo } from '../types';
import { CodeSignInModal } from './CodeSignInModal';
import { InstallPromptModal } from './InstallPromptModal';

interface HeaderProps {
  authInfo: AuthInfo | null;
  onLogin: (code: string) => Promise<string | void>;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ authInfo, onLogin, onLogout }) => {
  const [isSignInModalOpen, setSignInModalOpen] = useState(false);
  const [isInstallModalOpen, setInstallModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    if (!authInfo) return;
    switch (authInfo.type) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'therapist':
        navigate(`/therapist-dashboard/${authInfo.code}`);
        break;
      case 'place':
        navigate(`/place-dashboard/${authInfo.code}`);
        break;
    }
  };
  
  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <Logo layout="horizontal" className="h-10 w-auto" />
            </Link>
            <div className="flex items-center space-x-2">
              <button onClick={() => setInstallModalOpen(true)} className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors" title="Install App">
                <Download className="h-5 w-5" />
              </button>
              {authInfo ? (
                <>
                  <button onClick={handleDashboardClick} className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors" title="Go to Dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                  </button>
                  <button onClick={onLogout} className="p-2 text-gray-600 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors" title="Logout">
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button onClick={() => setSignInModalOpen(true)} className="flex items-center justify-center h-9 w-9 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors shadow-sm" title="Sign In">
                  <Key className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <CodeSignInModal 
        isOpen={isSignInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onLogin={onLogin}
      />
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </>
  );
};
