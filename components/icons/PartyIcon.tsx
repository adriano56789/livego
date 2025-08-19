
import React from 'react';

const PartyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.962 0L12 15.75M12 15.75a3.75 3.75 0 00-5.962 0L6 18.75m0 0a9.094 9.094 0 003.741.479 3 3 0 00-4.682-2.72M6.75 12a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0z" />
  </svg>
);

export default PartyIcon;