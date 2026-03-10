import React from 'react';

/**
 * Frame 2: Rose Garden
 * Design: Ornate frame with blooming roses and geometric patterns
 * Animations: Petal bloom effects, rotating ornaments, twinkling gems
 * Color Scheme: Hot pink (#ec4899), coral (#ff6b6b), purple (#a855f7), gold accents
 */
export const FrameRoseGarden: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <style>{`
        @keyframes petal-bloom {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        @keyframes rotate-ornament {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gem-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0px); opacity: 0.7; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </defs>
    
    {/* Main frame circle */}
    <circle cx="50" cy="50" r="40" stroke="#ec4899" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="39" stroke="#f472b6" strokeWidth="1" opacity="0.6" />
    
    {/* Top rose cluster */}
    <g style={{ animation: 'petal-bloom 3s infinite', transformOrigin: '50px 15px' }}>
      {/* Rose petals */}
      <circle cx="48" cy="12" r="2.5" fill="#ec4899" />
      <circle cx="52" cy="12" r="2.5" fill="#f472b6" />
      <circle cx="50" cy="10" r="2" fill="#fda4af" />
      <circle cx="49" cy="14" r="2" fill="#fb7185" />
      <circle cx="51" cy="14" r="2" fill="#f43f5e" />
    </g>
    
    {/* Left roses */}
    <g style={{ animation: 'petal-bloom 3.5s infinite 0.5s', transformOrigin: '12px 50px' }}>
      <circle cx="10" cy="48" r="2" fill="#ec4899" />
      <circle cx="10" cy="52" r="2" fill="#f472b6" />
      <circle cx="8" cy="50" r="1.5" fill="#fda4af" />
      <circle cx="12" cy="49" r="1.5" fill="#fb7185" />
      <circle cx="12" cy="51" r="1.5" fill="#f43f5e" />
    </g>
    
    {/* Right roses */}
    <g style={{ animation: 'petal-bloom 3.2s infinite 0.3s', transformOrigin: '88px 50px' }}>
      <circle cx="90" cy="48" r="2" fill="#ec4899" />
      <circle cx="90" cy="52" r="2" fill="#f472b6" />
      <circle cx="92" cy="50" r="1.5" fill="#fda4af" />
      <circle cx="88" cy="49" r="1.5" fill="#fb7185" />
      <circle cx="88" cy="51" r="1.5" fill="#f43f5e" />
    </g>
    
    {/* Bottom rose cluster */}
    <g style={{ animation: 'petal-bloom 2.8s infinite 0.7s', transformOrigin: '50px 85px' }}>
      <circle cx="48" cy="88" r="2.5" fill="#ec4899" />
      <circle cx="52" cy="88" r="2.5" fill="#f472b6" />
      <circle cx="50" cy="90" r="2" fill="#fda4af" />
      <circle cx="49" cy="86" r="2" fill="#fb7185" />
      <circle cx="51" cy="86" r="2" fill="#f43f5e" />
    </g>
    
    {/* Top center diamond */}
    <polygon points="50,8 54,14 50,20 46,14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" style={{ animation: 'gem-pulse 2.5s infinite' }} />
    
    {/* Bottom center diamond */}
    <polygon points="50,92 54,86 50,80 46,86" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" style={{ animation: 'gem-pulse 2.5s infinite 0.5s' }} />
    
    {/* Left center diamond */}
    <polygon points="6,50 12,54 6,58 0,54" fill="#a855f7" stroke="#c084fc" strokeWidth="0.5" style={{ animation: 'gem-pulse 3s infinite 0.3s' }} />
    
    {/* Right center diamond */}
    <polygon points="94,50 100,54 94,58 88,54" fill="#a855f7" stroke="#c084fc" strokeWidth="0.5" style={{ animation: 'gem-pulse 3s infinite 0.6s' }} />
    
    {/* Decorative ornaments */}
    <g style={{ animation: 'rotate-ornament 10s infinite', transformOrigin: '50px 50px' }}>
      <circle cx="35" cy="25" r="1.5" fill="#fbbf24" opacity="0.8" />
      <circle cx="65" cy="25" r="1.5" fill="#fbbf24" opacity="0.8" />
      <circle cx="35" cy="75" r="1.5" fill="#fbbf24" opacity="0.8" />
      <circle cx="65" cy="75" r="1.5" fill="#fbbf24" opacity="0.8" />
    </g>
    
    {/* Small twinkling stars */}
    <circle cx="25" cy="30" r="0.8" fill="#fda4af" style={{ animation: 'float-up 2s infinite' }} />
    <circle cx="75" cy="35" r="0.8" fill="#fda4af" style={{ animation: 'float-up 2.5s infinite 0.3s' }} />
    <circle cx="30" cy="70" r="0.8" fill="#fda4af" style={{ animation: 'float-up 2.2s infinite 0.5s' }} />
    <circle cx="70" cy="65" r="0.8" fill="#fda4af" style={{ animation: 'float-up 2.3s infinite 0.2s' }} />
  </svg>
);

export default FrameRoseGarden;
