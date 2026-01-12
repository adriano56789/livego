import { sendSuccess } from '../utils/response.js';
import { FrameModel } from '../models/Frame.js';
export const assetController = {
    getFrames: async (req, res) => {
        try {
            let frames = await FrameModel.find({ active: true });
            if (frames.length === 0) {
                const defaults = [
                    { id: 'FrameBlazingSun', name: 'Sol Escaldante', price: 500, category: 'avatar' },
                    { id: 'FrameBlueCrystal', name: 'Cristal Azul', price: 300, category: 'avatar' },
                    { id: 'FrameBlueFire', name: 'Fogo Azul', price: 600, category: 'avatar' },
                    { id: 'FrameDiamond', name: 'Diamante', price: 1000, category: 'avatar' },
                    { id: 'FrameNeonPink', name: 'Neon Rosa', price: 450, category: 'avatar' }
                ];
                await FrameModel.insertMany(defaults);
                frames = await FrameModel.find({ active: true });
            }
            return sendSuccess(res, frames);
        }
        catch (err) {
            return sendSuccess(res, []);
        }
    },
    getMusic: async (req, res) => {
        try {
            const music = [
                { id: 'm1', title: 'Top Hits 2024', artist: 'Vários', url: '#', duration: 180 },
                { id: 'm2', title: 'Phonk Brazil', artist: 'DJ Mix', url: '#', duration: 145 }
            ];
            return sendSuccess(res, music);
        }
        catch (err) {
            return sendSuccess(res, []);
        }
    }
};
