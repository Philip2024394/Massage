import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { PartyPopper, CheckCircle } from 'lucide-react';

export const RegistrationSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginCode } = location.state || {};

  if (!loginCode) {
    navigate('/register');
    return null;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(loginCode);
    alert('Login code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo layout="horizontal" className="h-12 w-auto mx-auto" />
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
          <PartyPopper className="h-16 w-16 text-primary-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your account is now pending admin approval. Here is your unique login code. Keep it safe!
          </p>

          <div className="bg-primary-50 border-2 border-dashed border-primary-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-primary-700 mb-2">Your Login Code:</p>
            <div 
              onClick={copyToClipboard}
              className="text-3xl font-bold tracking-widest text-primary-600 cursor-pointer"
              title="Click to copy"
            >
              {loginCode}
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            You will be notified by email once your account is approved. You can then log in to complete your profile.
          </p>

          <button
            onClick={() => navigate('/home')}
            className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
