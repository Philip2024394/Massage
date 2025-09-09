import React from 'react';

export const EnglishFlag: React.FC<{ className?: string }> = ({ className = "w-6 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" className={className}>
    <defs>
      <clipPath id="uk-circle-clip-shape">
        <circle cx="15" cy="15" r="15"/>
      </clipPath>
    </defs>
    <g clipPath="url(#uk-circle-clip-shape)">
      <rect width="30" height="30" fill="#012169"/>
      <path d="M-3,3L33,27 M-3,27L33,3" stroke="#fff" strokeWidth="6"/>
      <path d="M-3,3L33,27 M-3,27L33,3" stroke="#C8102E" strokeWidth="3.6"/>
      <path d="M15,0V30 M0,15H30" stroke="#fff" strokeWidth="9"/>
      <path d="M15,0V30 M0,15H30" stroke="#C8102E" strokeWidth="5.4"/>
    </g>
  </svg>
);
