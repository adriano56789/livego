
import React from 'react';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';
import FireIcon from './icons/FireIcon';
import VideoIcon from './icons/VideoIcon';
import LeafIcon from './icons/LeafIcon';

interface ProfileBadgeProps {
    badge: {
        text: string;
        type: 'gender_age' | 'level' | 'status' | 'regular' | 'top' | 'level2';
        icon?: 'female' | 'male' | 'fire' | 'play' | 'leaf';
    };
}

const getLevelStyles = (level: number) => {
    if (level < 10) { // Levels 1-9
        return { bgColor: 'bg-gradient-to-br from-amber-500 to-orange-700', icon: null, textColor: 'text-white' }; // Bronze
    }
    if (level < 20) { // Levels 10-19
        return { bgColor: 'bg-gradient-to-br from-slate-400 to-slate-600', icon: null, textColor: 'text-white' }; // Silver
    }
    if (level < 30) { // Levels 20-29
        return { bgColor: 'bg-gradient-to-br from-yellow-400 to-amber-500', icon: null, textColor: 'text-black' }; // Gold
    }
    if (level < 40) { // Levels 30-39
        return { bgColor: 'bg-gradient-to-br from-emerald-400 to-teal-600', icon: null, textColor: 'text-white' }; // Emerald
    }
    if (level < 50) { // Levels 40-49
        return { bgColor: 'bg-gradient-to-br from-sky-400 to-blue-600', icon: null, textColor: 'text-white' }; // Sapphire
    }
    if (level < 60) { // Levels 50-59
        return { bgColor: 'bg-gradient-to-br from-rose-500 to-red-600', icon: null, textColor: 'text-white' }; // Ruby
    }
    if (level < 80) { // Levels 60-79
        return { bgColor: 'bg-gradient-to-br from-fuchsia-500 to-purple-700', icon: null, textColor: 'text-white' }; // Amethyst
    }
    // Levels 80+
    return { bgColor: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500', icon: FireIcon, textColor: 'text-white' }; // Legendary/Fire
};

const ProfileBadge: React.FC<ProfileBadgeProps> = ({ badge }) => {
    let bgColor = 'bg-gray-700', 
        textColor = 'text-gray-200', 
        IconComponent: React.FC<any> | null = null, 
        hasIcon = false;

    switch (badge.type) {
        case 'gender_age':
            bgColor = badge.icon === 'female' ? 'bg-[#ff2d55]' : 'bg-[#007aff]';
            textColor = 'text-white';
            IconComponent = badge.icon === 'female' ? FemaleIcon : MaleIcon;
            hasIcon = true;
            break;
        case 'level':
            const level = parseInt(badge.text, 10);
            if (!isNaN(level)) {
                const styles = getLevelStyles(level);
                bgColor = styles.bgColor;
                textColor = styles.textColor;
                IconComponent = styles.icon;
                hasIcon = !!styles.icon;
            }
            break;
        case 'level2':
            bgColor = 'bg-cyan-500';
            textColor = 'text-white';
            IconComponent = LeafIcon;
            hasIcon = true;
            break;
        case 'status':
            bgColor = 'bg-red-600';
            textColor = 'text-white';
            IconComponent = undefined;
            hasIcon = false;
            break;
        case 'top':
            bgColor = 'bg-orange-500';
            textColor = 'text-white';
            IconComponent = VideoIcon;
            hasIcon = true;
            break;
        default:
            // Fallback is already set
            break;
    }

    // This handles the Simone 'Top' badge which has no icon.
    if (badge.type === 'status' && badge.text.toLowerCase() === 'regular' && badge.icon === 'play') {
        IconComponent = VideoIcon;
        hasIcon = true;
    }


    return (
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 ${bgColor} ${textColor} shrink-0`}>
            {hasIcon && IconComponent && <IconComponent className="w-2.5 h-2.5" />}
            <span>{badge.text}</span>
        </span>
    );
};

export default ProfileBadge;