
import React from 'react';
import { StarIcon, SolidDiamondIcon, CrownIcon } from './icons';

interface LevelBadgeProps {
    level: number;
    className?: string;
    styleType?: 'orange' | 'blue' | 'yellow' | 'green'; // Optional override
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, className = '', styleType }) => {
    let bg = 'bg-[#10B981]'; // Default Green
    let Icon = SolidDiamondIcon;

    // Determine style based on level if not explicitly provided via styleType
    if (styleType) {
        if (styleType === 'blue') {
            bg = 'bg-[#3b82f6]';
            Icon = SolidDiamondIcon;
        } else if (styleType === 'orange') {
            bg = 'bg-[#F97316]';
            Icon = StarIcon;
        } else if (styleType === 'yellow') {
            bg = 'bg-[#F59E0B]';
            Icon = StarIcon;
        } else if (styleType === 'green') {
            bg = 'bg-[#10B981]';
            Icon = SolidDiamondIcon;
        }
    } else {
        if (level < 10) {
            bg = 'bg-[#10B981]'; // Green - Diamond (Matches screenshot Level 1)
            Icon = SolidDiamondIcon;
        } else if (level < 20) {
            bg = 'bg-[#3b82f6]'; // Blue - Diamond
            Icon = SolidDiamondIcon;
        } else if (level < 30) {
            bg = 'bg-[#F97316]'; // Orange - Star
            Icon = StarIcon;
        } else if (level < 40) {
            bg = 'bg-[#8B5CF6]'; // Purple - Crown
            Icon = CrownIcon;
        } else if (level < 50) {
            bg = 'bg-[#EC4899]'; // Pink - Diamond
            Icon = SolidDiamondIcon;
        } else {
            bg = 'bg-[#DC2626]'; // Red - Crown (50+)
            Icon = CrownIcon;
        }
    }

    return (
        <div className={`flex items-center px-1.5 py-[1px] rounded-[4px] gap-0.5 min-w-[34px] justify-center h-[16px] ${bg} ${className}`}>
            <Icon className="w-2 h-2 text-white fill-white" />
            <span className="text-[9px] font-bold text-white leading-none pt-[1px]">{level}</span>
        </div>
    );
};
