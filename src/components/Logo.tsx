import React from 'react';

interface LogoProps {
  className?: string;
  layout?: 'vertical' | 'horizontal';
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-16 w-auto', layout = 'vertical' }) => {
  if (layout === 'horizontal') {
    // Horizontal logo for the main app header
    return (
      <div className="flex items-center">
        <svg
          className={className}
          viewBox="0 0 340 50"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4ade80', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
            </linearGradient>
            <style>
              {`
                .brand-heavy-h { font-family: 'Inter', system-ui, sans-serif; font-size: 36px; font-weight: 800; }
                .brand-light-h { font-family: 'Inter', system-ui, sans-serif; font-size: 34px; font-weight: 300; letter-spacing: 0.5px; }
              `}
            </style>
          </defs>
          <text
            x="0"
            y="35"
            className="brand-heavy-h"
            fill="url(#logoGradient)"
          >
            2Go
          </text>
          <text
            x="85"
            y="35"
            className="brand-light-h"
            fill="#374151"
          >
            Massage Hub
          </text>
        </svg>
      </div>
    );
  }

  // New vertical layout for the landing page
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 300 120"
        className="w-64 h-auto drop-shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`.brand-text { font-family: 'Inter', system-ui, sans-serif; font-size: 110px; font-weight: 800; fill: #22c55e; }`}
        </style>
        <text x="0" y="100" className="brand-text">
          2Go
        </text>
      </svg>
      <h2 className="text-5xl font-light tracking-wider mt-2 animate-glow">
        Massage Hub
      </h2>
    </div>
  );
};
