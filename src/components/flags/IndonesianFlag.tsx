import React from 'react';

export const IndonesianFlag: React.FC<{ className?: string }> = ({ className = "w-6 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" className={className}>
    <defs>
      <clipPath id="id-circle-clip">
        <circle cx="15" cy="15" r="15" />
      </clipPath>
    </defs>
    <g clipPath="url(#id-circle-clip)">
      <rect width="30" height="30" fill="#fff" />
      <rect width="30" height="15" fill="#ce1126" />
    </g>
  </svg>
);
