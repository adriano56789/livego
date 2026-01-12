import { sendSuccess } from '../utils/response.js';
import { UserModel } from '../models/User.js';
export const rankingController = {
    getRanking: (type) => async (req, res, next) => {
        try {
            const topUsers = await UserModel.find().sort({ diamonds: -1 }).limit(20).lean();
            const formattedRanking = topUsers.map((u, index) => ({
                ...u,
                rank: index + 1,
                value: (Number(u.diamonds) || 0) * 10
            }));
            return sendSuccess(res, formattedRanking);
        }
        catch (err) {
            next(err);
        }
    },
    getTopFans: async (req, res, next) => {
        try {
            const topFans = await UserModel.find().sort({ fans: -1 }).limit(10).lean();
            return sendSuccess(res, topFans);
        }
        catch (err) {
            next(err);
        }
    }
};
