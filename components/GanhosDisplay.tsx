import React, { useState, useEffect, useRef } from 'react';
import { CustomDiamondIcon } from './icons';

// Custom hook to animate number counting up
const useCountUp = (end: number, duration = 1000) => {
    const [count, setCount] = useState(0);
    const frameRef = useRef(0);
    const startCountRef = useRef(0);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Initialize count without animation on first render
        if (isFirstRender.current) {
            setCount(end);
            startCountRef.current = end;
            isFirstRender.current = false;
            return;
        }

        const startCount = startCountRef.current;
        const range = end - startCount;
        let startTime: number | null = null;

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(startCount + range * progress));

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(step);
            } else {
                startCountRef.current = end; // Update ref for next animation
            }
        };

        frameRef.current = requestAnimationFrame(step);

        return () => cancelAnimationFrame(frameRef.current);
    }, [end, duration]);

    return count;
};


interface GanhosDisplayProps {
    earnings: number;
}

const GanhosDisplay: React.FC<GanhosDisplayProps> = ({ earnings }) => {
    const formattedEarnings = useCountUp(earnings || 0);
    const [isGlowing, setIsGlowing] = useState(false);
    const prevEarningsRef = useRef(earnings);

    useEffect(() => {
        if (earnings > prevEarningsRef.current) {
            setIsGlowing(true);
            const timer = setTimeout(() => setIsGlowing(false), 800); // Duration of the glow animation
            return () => clearTimeout(timer);
        }
        // This condition is important to prevent glowing when earnings decrease (withdrawal)
        if (earnings !== prevEarningsRef.current) {
            prevEarningsRef.current = earnings;
        }
    }, [earnings]);

    return (
        <div className={`relative bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 rounded-2xl shadow-lg overflow-hidden my-4 ${isGlowing ? 'panel-glow-effect' : ''}`}>
            {/* Background twinkles */}
            <div className="absolute inset-0 twinkle-bg opacity-50"></div>

            <div className="relative z-10">
                <p className="text-sm font-semibold text-gray-400 mb-2">Disponível para saque</p>
                <div className="flex items-center space-x-3">
                    <CustomDiamondIcon className="w-10 h-10 drop-shadow-lg" />
                    <span className="text-5xl font-bold text-white tracking-tighter">
                        {formattedEarnings.toLocaleString('pt-BR')}
                    </span>
                </div>
                <p className="text-right text-gray-400 font-semibold mt-1">ganhos</p>
            </div>
        </div>
    );
};

export default GanhosDisplay;