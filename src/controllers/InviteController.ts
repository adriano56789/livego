
import { db, saveDb, CURRENT_USER_ID } from '../services/database';
import { Invitation } from '../types';
import { webSocketServerInstance } from '../services/websocket';

export const InviteController = {
    async sendInvitation(req: any, res: any) {
        const { roomId, userId } = req.body;
        const inviterId = CURRENT_USER_ID; 

        // Create new invitation
        const newInvitation: Invitation = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            inviterId: inviterId,
            inviteeId: userId,
            roomId: roomId,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        db.invitations.push(newInvitation);
        saveDb();
        
        // Notify user via WebSocket
        webSocketServerInstance.sendDirectInvite(userId, roomId);

        return res.status(200).json({ success: true });
    },

    async getReceivedInvitations(req: any, res: any) {
        const userId = CURRENT_USER_ID;
        const myInvitations = db.invitations.filter(inv => inv.inviteeId === userId);
        return res.status(200).json(myInvitations);
    },

    async getRoomDetails(req: any, res: any) {
        const { roomId } = req.params;
        const stream = db.streamers.find(s => s.id === roomId);
        if (stream) return res.status(200).json(stream);
        return res.status(404).json({ error: "Room not found" });
    },

    async joinRoom(req: any, res: any) {
        const { roomId } = req.params;
        const { userId } = req.body;
        const stream = db.streamers.find(s => s.id === roomId);
        
        if (!stream) return res.status(404).json({ error: "Room not found" });

        if (!stream.isPrivate || stream.hostId === userId) {
            return res.status(200).json({ success: true, canJoin: true });
        }

        // Check invitation
        const hasInvite = db.invitations.some(
            inv => inv.inviteeId === userId && inv.roomId === roomId
        );

        if (hasInvite) {
            return res.status(200).json({ success: true, canJoin: true });
        }
        
        return res.status(403).json({ error: "Access denied. Private room." });
    },

    async getPrivateRooms(req: any, res: any) {
        const { userId } = req.query;
        const requestingUserId = userId || CURRENT_USER_ID;
        const myInvites = db.invitations.filter(i => i.inviteeId === requestingUserId).map(i => i.roomId);
        const privateRooms = db.streamers.filter(s => s.isPrivate && (s.hostId === requestingUserId || myInvites.includes(s.id)));
        return res.status(200).json(privateRooms);
    }
};
