
import { db, saveDb, CameraPermissionState, LocationPermissionState, LoginState, CURRENT_USER_ID } from '../services/database';

export const DeviceStateController = {
    // --- Camera Permission State ---
    async getCameraState(req: any, res: any) {
        const { userId } = req.params;
        const state = db.cameraPermissionStates.get(userId) || { 
            userId, cameraStatus: 'prompt', microphoneStatus: 'prompt', updatedAt: new Date().toISOString() 
        };
        return res.status(200).json(state);
    },
    async updateCameraState(req: any, res: any) {
        const { userId } = req.params;
        const updates = req.body;
        const current = db.cameraPermissionStates.get(userId) || { userId, cameraStatus: 'prompt', microphoneStatus: 'prompt' };
        
        const newState: CameraPermissionState = {
            ...current,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        db.cameraPermissionStates.set(userId, newState);
        saveDb();
        return res.status(200).json({ success: true, state: newState });
    },

    // --- Location Permission State ---
    async getLocationState(req: any, res: any) {
        const { userId } = req.params;
        const state = db.locationPermissionStates.get(userId) || { userId, status: 'prompt', updatedAt: new Date().toISOString() };
        return res.status(200).json(state);
    },
    async updateLocationState(req: any, res: any) {
        const { userId } = req.params;
        const { status } = req.body;
        const newState: LocationPermissionState = {
            userId,
            status,
            updatedAt: new Date().toISOString()
        };
        db.locationPermissionStates.set(userId, newState);
        saveDb();
        return res.status(200).json({ success: true, state: newState });
    },

    // --- Login State ---
    async logLoginAttempt(req: any, res: any) {
        const { userId, ip, device, success } = req.body;
        const log: LoginState = {
            id: `login_${Date.now()}`,
            userId,
            ip,
            device,
            success,
            timestamp: new Date().toISOString()
        };
        db.loginStates.push(log);
        saveDb();
        return res.status(201).json({ success: true });
    },
    async getLoginHistory(req: any, res: any) {
        const { userId } = req.params;
        const history = db.loginStates.filter(l => l.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return res.status(200).json(history);
    }
};
