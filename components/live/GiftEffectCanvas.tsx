import React, { useEffect, useRef } from 'react';
import { Gift } from '../../types';

// Particle interface
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    decay: number;
    gravity: number;
    type: 'gift' | 'sparkle';
    rotation: number;
    rotationSpeed: number;
    color: string;
}

interface GiftEffectCanvasProps {
    gift: Gift;
}

const GiftEffectCanvas: React.FC<GiftEffectCanvasProps> = ({ gift }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        let particles: Particle[] = [];
        let animationFrameId: number;

        const particleCount = 80;
        const startX = canvas.width / 2;
        const startY = canvas.height + 30; // Start just below the screen
        const sparkleColors = ['#FFFFFF', '#FDE047', '#F0ABFC', '#A78BFA'];


        for (let i = 0; i < particleCount; i++) {
            // About 1 in 4 particles will be the gift icon, if available
            const isGiftParticle = i % 4 === 0 && gift.icon && typeof gift.icon === 'string';

            particles.push({
                x: startX,
                y: startY,
                vx: (Math.random() - 0.5) * 6,       // Horizontal spread
                vy: -(Math.random() * 10 + 10),    // Initial upward velocity
                size: isGiftParticle ? Math.random() * 20 + 25 : Math.random() * 4 + 2,
                alpha: 1,
                decay: Math.random() * 0.015 + 0.01, // Controls lifespan
                gravity: 0.2,
                type: isGiftParticle ? 'gift' : 'sparkle',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles = particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.alpha -= p.decay;
                p.rotation += p.rotationSpeed;

                if (p.alpha <= 0) return false;
                
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                
                if (p.type === 'gift' && typeof gift.icon === 'string') {
                    ctx.font = `${p.size}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(gift.icon, 0, 0);
                } else { // Sparkle particle
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    // Draw a simple star
                    ctx.moveTo(0, -p.size);
                    for (let i = 0; i < 5; i++) {
                        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * p.size, -Math.sin((18 + i * 72) * Math.PI / 180) * p.size);
                        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * p.size * 0.5, -Math.sin((54 + i * 72) * Math.PI / 180) * p.size * 0.5);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
                
                ctx.restore();
                
                return true;
            });

            if (particles.length > 0) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [gift]); // Re-run effect if the gift changes

    return <canvas ref={canvasRef} className="absolute inset-0 z-40 pointer-events-none" />;
};

export default GiftEffectCanvas;
