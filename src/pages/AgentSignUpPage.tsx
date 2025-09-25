import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, DollarSign, MessageCircle, Clock, AlertTriangle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { getWhatsAppUrl } from '../utils/location';

export const AgentSignUpPage: React.FC = () => {
  const salesNumber = import.meta.env.VITE_SALES_WHATSAPP_NUMBER;
  const message = "I would like more information to become a 2Go Agent For Massage Therapist And Places.";
  const whatsAppUrl = getWhatsAppUrl(salesNumber, message);

  const BenefitCard: React.FC<{ icon: React.ReactNode; title: string; content: string }> = ({ icon, title, content }) => (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 mt-1 text-primary-500">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{content}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="text-gray-700 hover:text-primary-600 p-2 rounded-full" title="Back to Home">
              <Home className="h-6 w-6" />
            </Link>
            <Logo layout="horizontal" className="h-10 w-auto" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a 2Go Agent</h1>
          <p className="text-md text-gray-600 mb-8">Join our network and earn by helping us grow.</p>
          
          <div className="space-y-8 mb-10">
            <BenefitCard 
              icon={<DollarSign className="h-7 w-7" />}
              title="Earn 20% Initial Commission"
              content="Receive a 20% commission for every new therapist or massage place you successfully sign up as a paid customer on our platform."
            />
             <BenefitCard 
              icon={<DollarSign className="h-7 w-7" />}
              title="Earn 10% Recurring Commission"
              content="Build a steady, profitable business at your own pace. We offer a 10% recurring commission for every renewal from the customers you enlist."
            />
            <BenefitCard 
              icon={<Users className="h-7 w-7" />}
              title="Recruit Professionals"
              content="Your role is to find and enlist talented massage therapists and quality massage places in your city or province, helping them reach more clients."
            />
            <BenefitCard 
              icon={<Clock className="h-7 w-7" />}
              title="Work On Your Own Hours"
              content="Enjoy the freedom and flexibility of working at your own convenience. Build your business from the comfort of your home."
            />
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-10">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Agent positions per location are limited. Hurry before your position has been filled!
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-6">Contact our sales team on WhatsApp to receive more information and begin the onboarding process. We'll provide you with everything you need, including your unique activation codes.</p>
            <a 
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-green-500 text-white font-bold text-lg rounded-lg hover:bg-green-600 transition-colors shadow-md"
            >
              <MessageCircle className="h-6 w-6" />
              Request Information on WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
