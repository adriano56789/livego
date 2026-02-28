import React from 'react';

export const LiveIndicatorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="24" height="24" viewBox="0 0 20 16" fill="currentColor" {...props}>
    <rect className="live-indicator-bar1" x="1" y="4" width="3" height="12" rx="1.5" />
    <rect className="live-indicator-bar2" x="6" y="0" width="3" height="16" rx="1.5" />
    <rect className="live-indicator-bar3" x="11" y="0" width="3" height="16" rx="1.5" />
    <rect className="live-indicator-bar4" x="16" y="4" width="3" height="12" rx="1.5" />
  </svg>
);