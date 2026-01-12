import { sendSuccess } from '../utils/response.js';
import { UserModel } from '../models/User.js';
export const feedController = {
    getFeedVideos: async (req, res, next) => {
        try {
            const mockPost = {
                id: 'post-1',
                type: 'video',
                mediaUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
                likes: 1234,
                commentCount: 56,
                description: 'Test video!',
                musicTitle: 'Test Music',
                user: { id: 'host-1', name: 'Streamer Teste', avatarUrl: 'https://picsum.photos/seed/host-1/100' }
            };
            return sendSuccess(res, [mockPost]);
        }
        catch (error) {
            next(error);
        }
    },
    createPost: async (req, res, next) => {
        try {
            const { mediaData, type, caption } = req.body;
            const newPost = {
                id: `post-${Date.now()}`,
                userId: req.userId,
                type,
                mediaUrl: "mock-url-from-base64",
                caption,
            };
            const user = await UserModel.findOne({ id: req.userId });
            return sendSuccess(res, { success: true, post: newPost, user });
        }
        catch (error) {
            next(error);
        }
    },
    likePost: async (req, res, next) => {
        try {
            return sendSuccess(res, { success: true });
        }
        catch (error) {
            next(error);
        }
    },
    addComment: async (req, res, next) => {
        try {
            const { text } = req.body;
            const { postId } = req.params;
            const user = await UserModel.findOne({ id: req.userId });
            const comment = { id: `c-${Date.now()}`, user, text };
            return sendSuccess(res, { success: true, comment });
        }
        catch (error) {
            next(error);
        }
    }
};
