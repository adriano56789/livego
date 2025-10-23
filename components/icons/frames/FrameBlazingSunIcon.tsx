import React from 'react';
import styled, { keyframes } from 'styled-components';

// ANIMAÇÕES
const finalGlow = keyframes`
  0%, 100% {
    filter: url(#glow-layer-1);
  }
  50% {
    filter: url(#glow-layer-2);
  }
`;

// COMPONENTES ESTILIZADOS
const SvgContainer = styled.svg`
  overflow: visible;
  animation: ${finalGlow} 3.5s infinite ease-in-out;
`;

// COMPONENTE PRINCIPAL
export const FrameBlazingSunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <SvgContainer viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        {/* MÚLTIPLOS FILTROS PARA CRIAR PROFUNDIDADE NO BRILHO */}
        <filter id="glow-layer-1">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
          <feFlood floodColor="#51DFFF" result="color1" />
          <feComposite in="color1" in2="blur1" operator="in" result="glow1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
          <feFlood floodColor="#A0E9FF" result="color2" />
          <feComposite in="color2" in2="blur2" operator="in" result="glow2" />
          <feMerge>
            <feMergeNode in="glow1" />
            <feMergeNode in="glow2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-layer-2">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
          <feFlood floodColor="#00BFFF" result="color1" />
          <feComposite in="color1" in2="blur1" operator="in" result="glow1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2" />
          <feFlood floodColor="#FFFFFF" result="color2" />
          <feComposite in="color2" in2="blur2" operator="in" result="glow2" />
          <feMerge>
            <feMergeNode in="glow1" />
            <feMergeNode in="glow2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* GRADIENTES DE ALTA FIDELIDADE */}
        <linearGradient id="FlameGradientFinal" gradientTransform="rotate(90 )">
          <stop offset="0%" stopColor="#007ACC" /><stop offset="50%" stopColor="#00BFFF" /><stop offset="100%" stopColor="#51DFFF" />
        </linearGradient>
        <linearGradient id="FlameStrokeFinal"><stop offset="0%" stopColor="#A0E9FF" /><stop offset="100%" stopColor="#FFF" /></linearGradient>
        <radialGradient id="FlowerGradientFinal"><stop offset="20%" stopColor="#6A0DAD" /><stop offset="100%" stopColor="#9370DB" /></radialGradient>
        <radialGradient id="FlowerCenterFinal"><stop offset="0%" stopColor="#FFF" /><stop offset="80%" stopColor="#FF9" /></radialGradient>
        <path id="runePathFinal" d="M 50,12 A 38,38 0 1 1 49.9,12" fill="none"/>
      </defs>

      {/* Camada de Fundo Escuro para Contraste */}
      <circle cx="50" cy="50" r="45" fill="#050810" />

      {/* BASE DO ANEL COM RUNAS */}
      <path d="M50,5 A 45,45 0 1 1 49.9,5 M50,12 A 38,38 0 1 0 50.1,12" fill="#081428" stroke="#153C6C" strokeWidth="0.5" fillRule="evenodd" />
      <text fill="#51DFFF" fontSize="3.5" opacity="0.4" letterSpacing="0.5">
        <textPath href="#runePathFinal" startOffset="2%">ᛗᛒᛞᛊᛏᛉᛇᛈᛉᛏᛊᛞᛒᛗᛒᛞᛊᛏᛉᛇᛈᛉᛏᛊᛞᛒᛗ</textPath>
      </text>

      {/* CHAMAS E FOLHAS (TRAÇADO FIEL) */}
      <g>
        <path d="M50,12 C45,15 42,20 45,25 S55,25 58,20 C55,15 52,12 50,12Z" fill="url(#FlameGradientFinal)" stroke="url(#FlameStrokeFinal)" strokeWidth="0.25" />
        <path d="M60,15 C58,20 60,25 65,28 S70,22 68,18 C65,16 62,15 60,15Z" fill="url(#FlameGradientFinal)" stroke="url(#FlameStrokeFinal)" strokeWidth="0.25" />
        <path d="M40,15 C42,20 40,25 35,28 S30,22 32,18 C35,16 38,15 40,15Z" fill="url(#FlameGradientFinal)" stroke="url(#FlameStrokeFinal)" strokeWidth="0.25" />
        <path d="M88,50 C85,45 80,42 75,45 S75,55 80,58 C85,55 88,52 88,50Z" transform="rotate(90 88 50)" fill="url(#FlameGradientFinal)" stroke="url(#FlameStrokeFinal)" strokeWidth="0.25" />
        <path d="M50,88 C45,85 42,80 45,75 S55,75 58,80 C55,85 52,88 50,88Z" transform="rotate(180 50 88)" fill="url(#FlameGradientFinal)" stroke="url(#FlameStrokeFinal)" strokeWidth="0.25" />
        <path d="M12,50 C15,45 20,42 25,45 S25,55 20,58 C15,55 12,52 12,50Z" transform="rotate(-90 12 50)" fill="url(#FlameGradientFinal)" stroke="url(#FlameStrokeFinal)" strokeWidth="0.25" />
      </g>
      
      {/* FLORES (COM DETALHES) */}
      <g>
        <g><path d="M78,78 a4,4 0 1,1 -8,0 a4,4 0 1,1 8,0" fill="url(#FlowerGradientFinal)" stroke="#C1A2E8" strokeWidth="0.3" /><circle cx="74" cy="78" r="1.5" fill="url(#FlowerCenterFinal)" /></g>
        <g><path d="M22,78 a4,4 0 1,1 -8,0 a4,4 0 1,1 8,0" fill="url(#FlowerGradientFinal)" stroke="#C1A2E8" strokeWidth="0.3" /><circle cx="18" cy="78" r="1.5" fill="url(#FlowerCenterFinal)" /></g>
        <g><path d="M70,30 a4,4 0 1,1 -8,0 a4,4 0 1,1 8,0" fill="url(#FlowerGradientFinal)" stroke="#C1A2E8" strokeWidth="0.3" /><circle cx="66" cy="30" r="1.5" fill="url(#FlowerCenterFinal)" /></g>
      </g>
    </SvgContainer>
  );
};
