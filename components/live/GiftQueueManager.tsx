import React, { useState, useEffect } from 'react';
import GiftAnimationOverlay, { GiftPayload } from './GiftAnimationOverlay';

interface QueuedGift extends GiftPayload {
    id: number;
    priority: number; // 1 = highest (expensive gifts), 10 = lowest
    queueTime: number;
}

interface GiftQueueManagerProps {
    gifts: GiftPayload[];
    onAnimationEnd: (id: number) => void;
    maxConcurrent?: number; // Maximum animations at once
    maxQueueSize?: number; // Maximum gifts in queue
}

const GiftQueueManager: React.FC<GiftQueueManagerProps> = ({
    gifts,
    onAnimationEnd,
    maxConcurrent = 3,
    maxQueueSize = 50
}) => {
    const [activeGifts, setActiveGifts] = useState<QueuedGift[]>([]);
    const [queue, setQueue] = useState<QueuedGift[]>([]);
    const [nextId, setNextId] = useState(0);

    // Calculate priority based on gift value (more expensive = higher priority)
    const calculatePriority = (gift: GiftPayload): number => {
        const value = gift.gift.price * gift.quantity;
        if (value >= 1000) return 1; // Ultra expensive gifts
        if (value >= 500) return 2;  // Very expensive gifts
        if (value >= 100) return 3;  // Expensive gifts
        if (value >= 50) return 4;   // Moderately expensive
        if (value >= 20) return 5;   // Average gifts
        if (value >= 10) return 6;   // Cheap gifts
        return 7; // Very cheap gifts
    };

    // Add new gifts to queue
    useEffect(() => {
        const newQueuedGifts: QueuedGift[] = gifts.map(gift => ({
            ...gift,
            id: nextId + gifts.indexOf(gift),
            priority: calculatePriority(gift),
            queueTime: Date.now()
        }));

        // Update nextId for future gifts
        if (newQueuedGifts.length > 0) {
            const maxId = Math.max(...newQueuedGifts.map(g => g.id));
            setNextId(maxId + 1);
        }

        // Merge with existing queue and sort by priority and time
        setQueue(prev => {
            const merged = [...prev, ...newQueuedGifts];
            // Sort by priority (lower number = higher priority), then by time (earlier = higher priority)
            const sorted = merged.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                return a.queueTime - b.queueTime;
            });
            // Limit queue size
            return sorted.slice(-maxQueueSize);
        });
    }, [gifts, maxQueueSize]);

    // Process queue - move gifts to active when slots are available
    useEffect(() => {
        if (activeGifts.length < maxConcurrent && queue.length > 0) {
            const nextGift = queue.shift();
            if (nextGift) {
                setActiveGifts(prev => [...prev, nextGift]);
                setQueue(prev => prev.filter(g => g.id !== nextGift.id));
            }
        }
    }, [activeGifts, queue, maxConcurrent]);

    // Handle animation end
    const handleAnimationEnd = (giftId: number) => {
        setActiveGifts(prev => prev.filter(g => g.id !== giftId));
        onAnimationEnd(giftId);
    };

    return (
        <div className="gift-queue-manager">
            {/* Active animations */}
            {activeGifts.map(gift => (
                <GiftAnimationOverlay
                    key={gift.id}
                    giftPayload={gift}
                    onAnimationEnd={handleAnimationEnd}
                />
            ))}
            
            {/* Queue indicator */}
            {queue.length > 0 && (
                <div className="fixed top-4 right-4 bg-purple-600 text-white px-3 py-2 rounded-full text-sm font-bold z-50">
                    🎁 Fila: {queue.length}
                </div>
            )}
        </div>
    );
};

export default GiftQueueManager;
