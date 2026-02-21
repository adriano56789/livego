
import { db, saveDb, CURRENT_USER_ID } from '../services/database';
import { FeedPhoto } from '../types';

export const FeedController = {
    async getFeed(req: any, res: any) {
        // Enriches feed with like status for current user
        const feedWithLikes = db.photoFeed.map((photo: FeedPhoto) => {
            const photoLikesSet = db.photoLikes.get(photo.id) || new Set();
            return {
                ...photo,
                isLiked: photoLikesSet.has(CURRENT_USER_ID),
                likes: photoLikesSet.size,
            };
        });
        return res.status(200).json(feedWithLikes);
    },

    async uploadPhoto(req: any, res: any) {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: "No image data" });
        
        // Mock upload: returns the base64/url received
        return res.status(200).json({ url: image });
    },

    async likePhoto(req: any, res: any) {
        const { photoId } = req.params;
        const userId = req.body.userId || CURRENT_USER_ID;
        
        if (!db.photoLikes.has(photoId)) {
            db.photoLikes.set(photoId, new Set());
        }
        const likesSet = db.photoLikes.get(photoId)!;
        const isLiked = likesSet.has(userId);
        
        if (isLiked) likesSet.delete(userId);
        else likesSet.add(userId);
        
        saveDb();

        return res.status(200).json({ 
            success: true, 
            likes: likesSet.size, 
            isLiked: !isLiked 
        });
    }
};
