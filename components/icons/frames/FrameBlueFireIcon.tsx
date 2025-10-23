import React from 'react';
import styled, { keyframes } from 'styled-components';

// ANIMAÇÕES DE PRECISÃO, FIÉIS À IMAGEM
const subtleGlowPulse = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 10px #0AF) drop-shadow(0 0 18px #0CF);
  }
  50% {
    filter: drop-shadow(0 0 16px #5DF) drop-shadow(0 0 28px #AEF);
  }
`;

const flicker = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.92; }
`;

// COMPONENTES ESTILIZADOS (COM OS NOMES CORRETOS)
const SvgContainer = styled.svg`
  overflow: visible;
  animation: ${subtleGlowPulse} 3.5s infinite ease-in-out;
`;

const FlamePath = styled.path`
  fill: url(#FlameGradient);
  stroke: url(#FlameStroke);
  stroke-width: 0.25;
  animation: ${flicker} 1.8s infinite;
  animation-delay: ${props => props.delay};
`;

const FlowerGroup = styled.g`
  filter: drop-shadow(0 0 4px #8A2BE2);
`;

// COMPONENTE PRINCIPAL
export const FrameBlueFireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <SvgContainer viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        {/* GRADIENTES DE ALTA FIDELIDADE */}
        <linearGradient id="FlameGradient" gradientTransform="rotate(90 )">
          <stop offset="0%" stopColor="#007ACC" />
          <stop offset="50%" stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#51DFFF" />
        </linearGradient>
        <linearGradient id="FlameStroke">
          <stop offset="0%" stopColor="#A0E9FF" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <radialGradient id="FlowerGradient">
          <stop offset="20%" stopColor="#6A0DAD" />
          <stop offset="100%" stopColor="#9370DB" />
        </radialGradient>
        <radialGradient id="FlowerCenter">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="80%" stopColor="#FFFF99" />
        </radialGradient>
        {/* Caminho para o texto das runas */}
        <path id="textPathRing" d="M 50,12 A 38,38 0 1 1 49.9,12" fill="none"/>
      </defs>

      {/* BASE DO ANEL COM RUNAS */}
      <path
        d="M 50,5 A 45,45 0 1 1 49.9,5 M 50,12 A 38,38 0 1 0 50.1,12"
        fill="#081428"
        stroke="#153C6C"
        strokeWidth="0.5"
        fillRule="evenodd"
      />
      <text fill="#51DFFF" fontSize="3.5" opacity="0.4" letterSpacing="0.5">
          <textPath href="#textPathRing" startOffset="2%">ᛗᛒᛞᛊᛏᛉᛇᛈᛉᛏᛊᛞᛒᛗᛒᛞᛊᛏᛉᛇᛈᛉᛏᛊᛞᛒᛗ</textPath>
      </text>

      {/* CHAMAS E FOLHAS (USANDO O NOME CORRETO 'FlamePath') */}
      <g>
        <FlamePath delay="0.1s" d="M50,12 C45,15 42,20 45,25 S55,25 58,20 C55,15 52,12 50,12Z" />
        <FlamePath delay="0.3s" d="M60,15 C58,20 60,25 65,28 S70,22 68,18 C65,16 62,15 60,15Z" />
        <FlamePath delay="0.2s" d="M40,15 C42,20 40,25 35,28 S30,22 32,18 C35,16 38,15 40,15Z" />
        <FlamePath delay="0.4s" d="M88,50 C85,45 80,42 75,45 S75,55 80,58 C85,55 88,52 88,50Z" transform="rotate(90 88 50)" />
        <FlamePath delay="0.5s" d="M50,88 C45,85 42,80 45,75 S55,75 58,80 C55,85 52,88 50,88Z" transform="rotate(180 50 88)" />
        <FlamePath delay="0.6s" d="M12,50 C15,45 20,42 25,45 S25,55 20,58 C15,55 12,52 12,50Z" transform="rotate(-90 12 50)" />
      </g>
      
      {/* FLORES (USANDO O NOME CORRETO 'FlowerGroup') */}
      <g>
        <FlowerGroup>
          <path d="M78,78 a4,4 0 1,1 -8,0 a4,4 0 1,1 8,0" fill="url(#FlowerGradient)" stroke="#C1A2E8" strokeWidth="0.3" />
          <circle cx="74" cy="78" r="1.5" fill="url(#FlowerCenter)" />
        </FlowerGroup>
        <FlowerGroup>
          <path d="M22,78 a4,4 0 1,1 -8,0 a4,4 0 1,1 8,0" fill="url(#FlowerGradient)" stroke="#C1A2E8" strokeWidth="0.3" />
          <circle cx="18" cy="78" r="1.5" fill="url(#FlowerCenter)" />
        </FlowerGroup>
        <FlowerGroup>
          <path d="M70,30 a4,4 0 1,1 -8,0 a4,4 0 1,1 8,0" fill="url(#FlowerGradient)" stroke="#C1A2E8" strokeWidth="0.3" />
          <circle cx="66" cy="30" r="1.5" fill="url(#FlowerCenter)" />
        </FlowerGroup>
      </g>
    </SvgContainer>
  );
};
