import React from 'react';

const MoneyRainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Dollar Sign */}
    <text x="50" y="65" fontSize="60" textAnchor="middle" fill="green" fontWeight="bold">$</text>
    {/* Wings */}
    <path d="M 20 50 C 0 40, 0 60, 20 50 Z" fill="lightgray" />
    <path d="M 80 50 C 100 40, 100 60, 80 50 Z" fill="lightgray" />
  </svg>
);

export default MoneyRainIcon;