import { Request, Response, NextFunction } from 'express';
import { StreamerModel } from '../models/Streamer.js';
import { UserModel } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

const genericSuccess = (req: Request, res: Response, next: NextFunction) => {
    try {
        return sendSuccess(res, { success: true });
    } catch (error) {
        next(error);
    }
};

export const streamController = {
    listByCategory: async (req: Request, res: Response) => {
        try {
            const { category } = req.params;
            const query = category === 'popular' ? {} : { category };
            const streams = await StreamerModel.find(query).sort({ viewers: -1 });
            res.json({ data: streams });
        } catch (err: any) {
            res.status(500).json({ error: "Erro ao buscar lives do banco: " + err.message });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const stream = await StreamerModel.create({
                ...req.body,
                id: `live-${Date.now()}`,
                viewers: Math.floor(Math.random() * 100)
            });
            res.status(201).json({ data: stream });
        } catch (err: any) {
            res.status(500).json({ error: "Erro ao registrar live no banco: " + err.message });
        }
    },

    update: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    deleteById: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    updateVideoQuality: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),

    search: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const streams = await StreamerModel.find().limit(5);
            return sendSuccess(res, streams);
        } catch (error) { next(error); }
    },
    getCategories: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = [
                { id: 'popular', label: 'Popular' }, { id: 'music', label: 'Música' },
                { id: 'dance', label: 'Dança' }, { id: 'pk', label: 'PK' }
            ];
            return sendSuccess(res, categories);
        } catch (error) { next(error); }
    },
    getGiftDonors: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const donors = await UserModel.find().sort({ diamonds: -1 }).limit(10);
            return sendSuccess(res, donors);
        } catch (error) { next(error); }
    },
    inviteToPrivateRoom: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    inviteFriendForCoHost: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),

    kickUser: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    makeModerator: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    toggleMicrophone: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    toggleStreamSound: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    toggleAutoFollow: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    toggleAutoPrivateInvite: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),

    getBeautySettings: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const settings = {
                tabs: [{ id: 'basic', label: 'Básico' }, { id: 'filters', label: 'Filtros' }],
                effects: {
                    basic: [{ id: 'smooth', label: 'Suavizar', icon: 'FaceSmoothIcon', defaultValue: 50 }, { id: 'whiten', label: 'Clarear', icon: 'SunIcon', defaultValue: 30 }, { id: 'none', label: 'Nenhum', icon: 'BanIcon', defaultValue: 0 }],
                    filters: [{ id: 'vintage', label: 'Vintage', image: 'https://picsum.photos/seed/vintage/100' }],
                },
                slider: { label: 'Intensidade' },
                actions: [{ id: 'save', label: 'Salvar' }, { id: 'reset', label: 'Resetar' }]
            };
            return sendSuccess(res, settings);
        } catch (error) { next(error); }
    },
    saveBeautySettings: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    resetBeautySettings: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    applyBeautyEffect: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
    logBeautyTabClick: async (req: Request, res: Response, next: NextFunction) => genericSuccess(req, res, next),
};
