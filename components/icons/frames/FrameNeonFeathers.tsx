import React from 'react';

/**
 * Frame 5: Neon Feathers
 * Design: Vibrant frame with flowing feather elements
 * Animations: Floating feathers, pulsing neon glow, wave effects
 * Color Scheme: Hot pink (#ec4899), magenta (#d946ef), cyan (#06b6d4), neon green (#84cc16)
 */
export const FrameNeonFeathers: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <style>{`
        @keyframes feather-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-4px) rotate(5deg); opacity: 1; }
        }
        @keyframes feather-float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-4px) rotate(-5deg); opacity: 1; }
        }
        @keyframes neon-glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(236, 72, 153, 0.4)); }
          50% { filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.9)); }
        }
        @keyframes wave-motion {
          0% { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: -50; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 1px rgba(132, 204, 22, 0.3)); }
          50% { opacity: 1; filter: drop-shadow(0 0 4px rgba(132, 204, 22, 0.8)); }
        }
      `}</style>
    </defs>
    
    {/* Main neon frame */}
    <circle cx="50" cy="50" r="40" stroke="#ec4899" strokeWidth="2.5" style={{ animation: 'neon-glow 3s infinite' }} />
    <circle cx="50" cy="50" r="38" stroke="#d946ef" strokeWidth="1" opacity="0.5" />
    
    {/* Top left feather */}
    <g style={{ animation: 'feather-float 3s infinite', transformOrigin: '25px 20px' }}>
      <path d="M 25 15 Q 23 18 25 25 Q 27 18 25 15" fill="#ec4899" stroke="#d946ef" strokeWidth="0.5" />
      <path d="M 25 17 Q 24 19 25 23" stroke="#84cc16" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Top right feather */}
    <g style={{ animation: 'feather-float-reverse 3.5s infinite', transformOrigin: '75px 20px' }}>
      <path d="M 75 15 Q 77 18 75 25 Q 73 18 75 15" fill="#d946ef" stroke="#ec4899" strokeWidth="0.5" />
      <path d="M 75 17 Q 76 19 75 23" stroke="#84cc16" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Bottom left feather */}
    <g style={{ animation: 'feather-float-reverse 3.2s infinite 0.5s', transformOrigin: '25px 80px' }}>
      <path d="M 25 85 Q 23 82 25 75 Q 27 82 25 85" fill="#06b6d4" stroke="#0ea5e9" strokeWidth="0.5" />
      <path d="M 25 83 Q 24 81 25 77" stroke="#84cc16" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Bottom right feather */}
    <g style={{ animation: 'feather-float 2.8s infinite 0.3s', transformOrigin: '75px 80px' }}>
      <path d="M 75 85 Q 77 82 75 75 Q 73 82 75 85" fill="#06b6d4" stroke="#0ea5e9" strokeWidth="0.5" />
      <path d="M 75 83 Q 76 81 75 77" stroke="#84cc16" strokeWidth="0.5" fill="none" />
    </g>
    
    {/* Top center diamond */}
    <polygon points="50,8 54,16 50,24 46,16" fill="#84cc16" stroke="#65a30d" strokeWidth="0.5" style={{ animation: 'pulse-glow 2.5s infinite' }} />
    
    {/* Bottom center diamond */}
    <polygon points="50,92 54,84 50,76 46,84" fill="#84cc16" stroke="#65a30d" strokeWidth="0.5" style={{ animation: 'pulse-glow 2.5s infinite 0.5s' }} />
    
    {/* Left center diamond */}
    <polygon points="6,50 14,55 6,60 -2,55" fill="#06b6d4" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'pulse-glow 2.5s infinite 0.3s' }} />
    
    {/* Right center diamond */}
    <polygon points="94,50 102,55 94,60 86,55" fill="#06b6d4" stroke="#0ea5e9" strokeWidth="0.5" style={{ animation: 'pulse-glow 2.5s infinite 0.6s' }} />
    
    {/* Wave patterns */}
    <path d="M 30 50 Q 35 45 40 50 T 50 50" stroke="#84cc16" strokeWidth="1" fill="none" opacity="0.6" style={{ animation: 'wave-motion 4s infinite' }} />
    <path d="M 50 50 Q 55 45 60 50 T 70 50" stroke="#84cc16" strokeWidth="1" fill="none" opacity="0.6" style={{ animation: 'wave-motion 4s infinite 0.5s' }} />
    
    {/* Decorative neon circles */}
    <circle cx="20" cy="35" r="1.2" fill="#ec4899" style={{ animation: 'pulse-glow 2s infinite 0.2s' }} />
    <circle cx="80" cy="35" r="1.2" fill="#d946ef" style={{ animation: 'pulse-glow 2s infinite 0.4s' }} />
    <circle cx="20" cy="65" r="1.2" fill="#06b6d4" style={{ animation: 'pulse-glow 2s infinite 0.6s' }} />
    <circle cx="80" cy="65" r="1.2" fill="#0ea5e9" style={{ animation: 'pulse-glow 2s infinite 0.8s' }} />
    
    {/* Inner accent circle */}
    <circle cx="50" cy="50" r="35" stroke="#84cc16" strokeWidth="0.5" opacity="0.3" />
  </svg>
);

export default FrameNeonFeathers;
