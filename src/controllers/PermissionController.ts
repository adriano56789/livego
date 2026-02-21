
import { db, saveDb } from '../services/database';

export const PermissionController = {
    async getCameraPermission(req: any, res: any) {
        const { userId } = req.params;
        const status = db.permissions.get(userId)?.camera || 'prompt';
        return res.status(200).json({ status });
    },

    async updateCameraPermission(req: any, res: any) {
        const { userId } = req.params;
        const { status } = req.body;
        const userPermissions = db.permissions.get(userId) || { camera: 'prompt', microphone: 'prompt' };
        userPermissions.camera = status;
        db.permissions.set(userId, userPermissions);
        saveDb();
        return res.status(200).json({});
    },

    async getMicrophonePermission(req: any, res: any) {
        const { userId } = req.params;
        const status = db.permissions.get(userId)?.microphone || 'prompt';
        return res.status(200).json({ status });
    },

    async updateMicrophonePermission(req: any, res: any) {
        const { userId } = req.params;
        const { status } = req.body;
        const userPermissions = db.permissions.get(userId) || { camera: 'prompt', microphone: 'prompt' };
        userPermissions.microphone = status;
        db.permissions.set(userId, userPermissions);
        saveDb();
        return res.status(200).json({});
    }
};
