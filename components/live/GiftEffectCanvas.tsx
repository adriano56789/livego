
import React, { useEffect, useRef } from 'react';
import { Gift } from '../../types';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    life: number;
    maxLife: number;
    type: 'circle' | 'star' | 'sparkle';
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

        // Configuração de tela cheia
        const updateSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        let particles: Particle[] = [];
        let animationFrameId: number;

        // Cores vibrantes baseadas na categoria (Fallback para cores brilhantes gerais)
        const getColors = () => {
            switch (gift.category) {
                case 'Luxo': return ['#FFD700', '#FDB931', '#FFFACD', '#DAA520', '#FFFFFF']; // Gold/White
                case 'VIP': return ['#FF00FF', '#BC13FE', '#00FFFF', '#E0AAFF', '#F0ABFC']; // Neon Purple/Cyan
                case 'Atividade': return ['#00FF00', '#7CFF01', '#FFFF00', '#32CD32', '#FFFFFF']; // Lime/Green
                case 'Entrada': return ['#FF4500', '#FF6347', '#FFD700', '#FFFFFF']; // Fire colors
                case 'Efeito': return ['#FF1493', '#00BFFF', '#FFD700', '#FFFFFF', '#FF69B4']; // Magic mix
                default: return ['#FF0099', '#493240', '#FF00CC', '#9900FF', '#FFFFFF', '#00FFFF']; // Vibrant Mix
            }
        };

        const colors = getColors();
        const particleCount = 150; // Quantidade alta para impacto
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Criar explosão inicial
        for (let i = 0; i < particleCount; i++) {
            const speed = Math.random() * 15 + 5; // Velocidade alta inicial
            const angle = Math.random() * Math.PI * 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const typeRand = Math.random();
            let type: Particle['type'] = 'circle';
            if (typeRand > 0.7) type = 'sparkle';
            if (typeRand > 0.9) type = 'star';

            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed * (Math.random() * 0.8 + 0.2),
                vy: Math.sin(angle) * speed * (Math.random() * 0.8 + 0.2),
                size: Math.random() * 6 + 2, // Tamanho visível
                color: color,
                alpha: 1,
                life: 0,
                maxLife: Math.random() * 60 + 40, // Duração em frames
                type: type
            });
        }

        // Função auxiliar para desenhar estrelas
        const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fill();
        }

        const animate = () => {
            // Limpar com leve rastro (trail) transparente não funciona bem em canvas transparente sobre vídeo.
            // Para "brilho", usamos clear total mas com globalCompositeOperation 'lighter' no desenho.
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Modo de mistura para cores brilhantes (neon)
            ctx.globalCompositeOperation = 'lighter';

            particles = particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.92; // Atrito forte para efeito de explosão que para no ar
                p.vy *= 0.92;
                p.vy += 0.15; // Gravidade leve caindo
                
                p.life++;
                // Fade out no final da vida
                if (p.life > p.maxLife - 20) {
                    p.alpha -= 0.05;
                }

                if (p.alpha <= 0) return false;

                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                
                // Glow effect via shadow
                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;

                if (p.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === 'star') {
                    drawStar(p.x, p.y, 5, p.size * 2, p.size);
                } else if (p.type === 'sparkle') {
                    // Cruz de brilho
                    ctx.beginPath();
                    ctx.fillRect(p.x - p.size, p.y - p.size/4, p.size*2, p.size/2);
                    ctx.fillRect(p.x - p.size/4, p.y - p.size, p.size/2, p.size*2);
                }
                
                ctx.shadowBlur = 0; // Reset shadow

                return true;
            });

            if (particles.length > 0) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            window.removeEventListener('resize', updateSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [gift]); // Recria o efeito se o objeto gift mudar, mas o pai já força recriação via Key

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />;
};

export default GiftEffectCanvas;
