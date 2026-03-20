import React from 'react';
import { User } from '../../types';
import * as FrameIcons from '../icons/frames';

interface AvatarWithFrameProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFrame?: boolean;
  onClick?: () => void;
}

// Mapeamento dos frames para seus componentes
const frameComponentMap: Record<string, React.ComponentType<any>> = {
  'FrameBlueCrystal': FrameIcons.FrameBlueCrystal,
  'FrameRoseGarden': FrameIcons.FrameRoseGarden,
  'FrameCopperPearls': FrameIcons.FrameCopperPearls,
  'FrameOrnateMagenta': FrameIcons.FrameOrnateMagenta,
  'FrameNeonFeathers': FrameIcons.FrameNeonFeathers,
  'FrameBaroqueElegance': FrameIcons.FrameBaroqueElegance,
  'FrameMysticalWings': FrameIcons.FrameMysticalWings,
  'FrameCosmicFire': FrameIcons.FrameCosmicFire,
  'FrameCelestialCrown': FrameIcons.FrameCelestialCrown,
};

// Função para verificar se o frame ainda é válido
const isFrameValid = (user: User): boolean => {
  if (!user.activeFrameId) return false;
  
  const ownedFrames = (user as any).ownedFrames || [];
  const activeFrame = ownedFrames.find((f: any) => f.frameId === user.activeFrameId);
  
  if (!activeFrame) return false;
  
  const expirationDate = new Date(activeFrame.expirationDate);
  const now = new Date();
  return expirationDate > now;
};

// Fallback SVG local (evita via.placeholder que causa ERR_NAME_NOT_RESOLVED)
const AVATAR_PLACEHOLDER_SVG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="#4B5563"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="48">?</text></svg>');

const avatarSrc = (avatarUrl: string | undefined, _name: string): string => {
  if (!avatarUrl || avatarUrl.trim() === '') return AVATAR_PLACEHOLDER_SVG;
  const sep = avatarUrl.includes('?') ? '&' : '?';
  return `${avatarUrl}${sep}t=${avatarUrl.length}_${avatarUrl.slice(-12)}`;
};

// Função para obter o componente do frame
const getFrameComponent = (frameId: string | null): React.ComponentType<any> | null => {
  if (!frameId) return null;
  return frameComponentMap[frameId] || null;
};

// Tamanhos predefinidos
const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24'
};

const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({ 
  user, 
  size = 'md', 
  className = '', 
  showFrame = true,
  onClick 
}) => {
  const hasValidFrame = showFrame && isFrameValid(user);
  const FrameComponent = getFrameComponent(user.activeFrameId);

  const avatarSize = sizeClasses[size];

  return (
    <div className={`relative inline-block ${avatarSize} ${className}`}>
      {/* Frame - centralizado com descimento sutil para cobrir parte inferior */}
      {hasValidFrame && FrameComponent && (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10`}>
          <FrameComponent 
            className="w-full h-full" 
            style={{ 
              transform: 'scale(1.4) translateY(2px)',
              transformOrigin: 'center'
            }}
          />
        </div>
      )}
      
      {/* Avatar */}
      <div 
        className={`${avatarSize} rounded-full overflow-hidden bg-gray-700 cursor-pointer hover:border-blue-400 transition-colors z-0`}
        onClick={onClick}
      >
        <img
          src={avatarSrc(user.avatarUrl, user.name)}
          alt={user.name || 'User'}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = AVATAR_PLACEHOLDER_SVG;
          }}
        />
      </div>
    </div>
  );
};

export default AvatarWithFrame;
