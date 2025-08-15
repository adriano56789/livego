
import React from 'react';

const SmileyBadgeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a.75.75 0 01.083.665l-.083.083a.75.75 0 01-1.06-1.06l.083-.083a.75.75 0 01.977.332z" clipRule="evenodd" />
  </svg>
);

export default SmileyBadgeIcon;
