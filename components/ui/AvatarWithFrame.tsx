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
  const frameSize = size === 'sm' ? 'w-14 h-14' : 
                   size === 'md' ? 'w-20 h-20' : 
                   size === 'lg' ? 'w-24 h-24' : 'w-28 h-28';

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Frame */}
      {hasValidFrame && FrameComponent && (
        <div className={`absolute inset-0 ${frameSize} pointer-events-none z-10`}>
          <FrameComponent className="w-full h-full" />
        </div>
      )}
      
      {/* Avatar */}
      <div 
        className={`${avatarSize} rounded-full overflow-hidden bg-gray-700 border-2 border-gray-600 cursor-pointer hover:border-blue-400 transition-colors ${
          hasValidFrame ? 'z-0' : 'z-10'
        }`}
        onClick={onClick}
      >
        <img
          src={user.avatarUrl || `https://via.placeholder.com/150/4B5563/FFFFFF?text=${encodeURIComponent(user.name || 'User')}`}
          alt={user.name || 'User'}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/150/4B5563/FFFFFF?text=${encodeURIComponent(user.name || 'User')}`;
          }}
        />
      </div>
    </div>
  );
};

export default AvatarWithFrame;
