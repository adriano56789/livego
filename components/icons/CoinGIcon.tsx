import React from 'react';

// Ícone de moeda dourada com letra G - criado para resolver importação ausente
const CoinGIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="#FFD700"
      stroke="#FFA500"
      strokeWidth="2"
    />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fill="#FF8C00"
      fontSize="14"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      G
    </text>
  </svg>
);

export default CoinGIcon;