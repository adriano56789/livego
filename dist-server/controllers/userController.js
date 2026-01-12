import { UserModel } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { StreamHistoryModel } from '../models/StreamHistory.js';
import { StreamerModel } from '../models/Streamer.js';
import { BlockModel } from '../models/Block.js';
import { FollowerModel } from '../models/Follower.js';
export const userController = {
    getMe: async (req, res) => {
        try {
            const user = await UserModel.findOne({ id: req.userId });
            if (!user)
                return sendError(res, "Sessão inválida.", 404);
            return sendSuccess(res, user);
        }
        catch (err) {
            return sendError(res, "Erro ao processar dados.");
        }
    },
    updateMe: async (req, res, next) => {
        try {
            const allowedUpdates = [
                'name', 'bio', 'location', 'gender', 'birthday', 'emotionalState',
                'tags', 'profession', 'notificationSettings', 'showLocation',
                'showActivityStatus', 'hideLikes', 'chatPermission', 'privateInvitePermission',
                'isAvatarProtected', 'avatarUrl', 'coverUrl', 'uiSettings', 'connectedAccounts'
            ];
            const updates = {};
            Object.keys(req.body).forEach(key => {
                if (allowedUpdates.includes(key))
                    updates[key] = req.body[key];
            });
            if (Object.keys(updates).length === 0)
                return sendError(res, "Nenhuma atualização válida.", 400);
            const updatedUser = await UserModel.findOneAndUpdate({ id: req.userId }, { $set: updates }, { new: true });
            if (!updatedUser)
                return sendError(res, "Usuário não encontrado.", 404);
            return sendSuccess(res, { success: true, user: updatedUser });
        }
        catch (error) {
            next(error);
        }
    },
    getUser: async (req, res) => {
        try {
            const user = await UserModel.findOne({ id: req.params.id });
            if (!user)
                return sendError(res, "Perfil não encontrado.", 404);
            return sendSuccess(res, user);
        }
        catch (err) {
            return sendError(res, "Falha na consulta.");
        }
    },
    search: async (req, res, next) => {
        try {
            const users = await UserModel.find().limit(5);
            return sendSuccess(res, users);
        }
        catch (err) {
            next(err);
        }
    },
    getFriends: async (req, res, next) => {
        try {
            const users = await UserModel.find({ id: { $ne: req.userId } }).limit(10);
            return sendSuccess(res, users);
        }
        catch (err) {
            next(err);
        }
    },
    setLanguage: async (req, res, next) => {
        try {
            return sendSuccess(res, { success: true });
        }
        catch (err) {
            next(err);
        }
    },
    getWithdrawalHistory: async (req, res, next) => {
        try {
            return sendSuccess(res, []);
        }
        catch (err) {
            next(err);
        }
    },
    setActiveFrame: async (req, res, next) => {
        try {
            const { frameId } = req.body;
            const updatedUser = await UserModel.findOneAndUpdate({ id: req.userId }, { activeFrameId: frameId }, { new: true });
            return sendSuccess(res, updatedUser);
        }
        catch (err) {
            next(err);
        }
    },
    getReminders: async (req, res, next) => {
        try {
            const streamers = await StreamerModel.find().limit(3);
            const reminders = streamers.map(s => ({ ...s.toObject(), isLive: Math.random() > 0.5 }));
            return sendSuccess(res, reminders);
        }
        catch (err) {
            next(err);
        }
    },
    removeReminder: async (req, res, next) => {
        try {
            return sendSuccess(res, { success: true });
        }
        catch (err) {
            next(err);
        }
    },
    getOnlineUsers: async (req, res) => {
        try {
            const users = await UserModel.find({ isOnline: true }).limit(50);
            return sendSuccess(res, users);
        }
        catch (err) {
            return sendError(res, "Erro ao recuperar usuários.");
        }
    },
    updateBillingAddress: async (req, res) => {
        try {
            const updated = await UserModel.findOneAndUpdate({ id: req.userId }, { billingAddress: req.body }, { new: true });
            return sendSuccess(res, updated, "Endereço atualizado.");
        }
        catch (err) {
            return sendError(res, "Erro ao salvar endereço.");
        }
    },
    updateCreditCard: async (req, res) => {
        try {
            const { number, brand, expiry } = req.body;
            const cardData = { last4: number ? number.slice(-4) : '****', brand: brand || 'Visa', expiry: expiry };
            const updated = await UserModel.findOneAndUpdate({ id: req.userId }, { creditCardInfo: cardData }, { new: true });
            return sendSuccess(res, updated, "Cartão vinculado.");
        }
        catch (err) {
            return sendError(res, "Erro ao salvar cartão.");
        }
    },
    follow: async (req, res) => {
        try {
            const targetId = req.params.id;
            const myId = req.userId;
            const updatedMe = await UserModel.findOneAndUpdate({ id: myId }, { $addToSet: { followingIds: targetId }, $inc: { following: 1 } }, { new: true });
            await UserModel.findOneAndUpdate({ id: targetId }, { $inc: { fans: 1 } });
            return sendSuccess(res, updatedMe);
        }
        catch (err) {
            return sendError(res, "Erro ao seguir.");
        }
    },
    addStreamToHistory: async (req, res, next) => {
        try {
            const { streamerId } = req.body;
            if (!streamerId)
                return sendError(res, "streamerId é obrigatório.", 400);
            await StreamHistoryModel.findOneAndUpdate({ userId: req.userId, streamerId }, { lastWatchedAt: new Date() }, { upsert: true });
            return sendSuccess(res, { success: true });
        }
        catch (error) {
            next(error);
        }
    },
    getStreamHistory: async (req, res, next) => {
        try {
            const historyEntries = await StreamHistoryModel.find({ userId: req.userId }).sort({ lastWatchedAt: -1 }).limit(50).lean();
            const streamerIds = historyEntries.map(h => h.streamerId);
            const streamers = await StreamerModel.find({ hostId: { $in: streamerIds } }).lean();
            const streamersMap = new Map(streamers.map(s => [s.hostId, s]));
            const populatedHistory = historyEntries.map(entry => {
                const streamer = streamersMap.get(entry.streamerId);
                if (!streamer)
                    return null;
                return { id: streamer.id, streamerId: streamer.hostId, name: streamer.name, avatar: streamer.avatar, isLive: streamer.viewers > 0, lastWatchedAt: entry.lastWatchedAt };
            }).filter(Boolean);
            return sendSuccess(res, populatedHistory);
        }
        catch (error) {
            next(error);
        }
    },
    clearStreamHistory: async (req, res, next) => {
        try {
            await StreamHistoryModel.deleteMany({ userId: req.userId });
            return sendSuccess(res, { success: true });
        }
        catch (error) {
            next(error);
        }
    },
    getBlocklist: async (req, res, next) => {
        try {
            const blockedRelations = await BlockModel.find({ blockerId: req.userId }).lean();
            const blockedIds = blockedRelations.map(b => b.blockedId);
            const blockedUsers = await UserModel.find({ id: { $in: blockedIds } });
            return sendSuccess(res, blockedUsers);
        }
        catch (error) {
            next(error);
        }
    },
    blockUser: async (req, res, next) => {
        try {
            const { userId: blockedId } = req.params;
            if (req.userId === blockedId)
                return sendError(res, "Não pode bloquear a si mesmo.", 400);
            await BlockModel.findOneAndUpdate({ blockerId: req.userId, blockedId }, {}, { upsert: true });
            await UserModel.updateOne({ id: req.userId }, { $pull: { followingIds: blockedId } });
            return sendSuccess(res, { success: true });
        }
        catch (error) {
            next(error);
        }
    },
    unblockUser: async (req, res, next) => {
        try {
            await BlockModel.deleteOne({ blockerId: req.userId, blockedId: req.params.userId });
            return sendSuccess(res, { success: true });
        }
        catch (error) {
            next(error);
        }
    },
    getFans: async (req, res, next) => {
        try {
            const targetId = req.params.id === 'me' ? req.userId : req.params.id;
            const fanRelations = await FollowerModel.find({ followingId: targetId }).lean();
            const fanIds = fanRelations.map(f => f.followerId);
            const fans = await UserModel.find({ id: { $in: fanIds } });
            return sendSuccess(res, fans);
        }
        catch (error) {
            next(error);
        }
    },
    getFollowing: async (req, res, next) => {
        try {
            const targetId = req.params.userId === 'me' ? req.userId : req.params.userId;
            const user = await UserModel.findOne({ id: targetId }).lean();
            if (!user || !user.followingIds)
                return sendSuccess(res, []);
            const followingUsers = await UserModel.find({ id: { $in: user.followingIds } });
            return sendSuccess(res, followingUsers);
        }
        catch (error) {
            next(error);
        }
    },
    getVisitors: async (req, res, next) => {
        try {
            const targetId = req.params.userId === 'me' ? req.userId : req.params.userId;
            const history = await StreamHistoryModel.find({ streamerId: targetId }).sort({ lastWatchedAt: -1 }).limit(50).lean();
            const visitorIds = [...new Set(history.map(h => h.userId))];
            const visitors = await UserModel.find({ id: { $in: visitorIds } });
            return sendSuccess(res, visitors);
        }
        catch (error) {
            next(error);
        }
    }
};
