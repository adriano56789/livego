
import { db, createChatKey, saveDb } from './database';
import { Message, User, Gift, Streamer, EligibleUser, PurchaseRecord } from '../types';

if (!(db as any).kickedUsers) {
    (db as any).kickedUsers = new Map<string, Set<string>>();
}
if (!(db as any).moderators) {
    (db as any).moderators = new Map<string, Set<string>>();
}

// --- Simple Event Emitter ---
class EventEmitter {
    private events: Map<string, Function[]>;

    constructor() {
        this.events = new Map();
    }

    on(event: string, listener: Function) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(listener);
    }

    off(event: string, listener: Function) {
        if (this.events.has(event)) {
            const listeners = this.events.get(event)!.filter(l => l !== listener);
            this.events.set(event, listeners);
        }
    }

    emit(event: string, payload: any) {
        if (this.events.has(event)) {
            this.events.get(event)!.forEach(listener => listener(payload));
        }
    }
}

// --- Simulated WebSocket Server ---
class SimulatedWebSocketServer {
    private connections = new Map<string, { onMessage: (data: any) => void }>();

    connect(userId: string, client: { onMessage: (data: any) => void }) {
        console.log(`[WS Server] User connected: ${userId}`);
        this.connections.set(userId, client);
    }

    disconnect(userId: string) {
        console.log(`[WS Server] User disconnected: ${userId}`);
        this.connections.delete(userId);
        // Also remove user from any rooms they were in
        db.streamRooms.forEach((users, roomId) => {
            if (users.has(userId)) {
                this.handleLeaveRoom(userId, roomId as string);
            }
        });
    }

    private sendToUser(userId: string, data: {type: string, payload: any}) {
        const userSocket = this.connections.get(userId);
        if (userSocket) {
            userSocket.onMessage(data);
            console.log(`[WS Server] Sent direct message to ${userId}:`, data);
        }
    }

    public broadcastNewMessageToChat(chatKey: string, message: Message, tempId?: string) {
        const [userId1, userId2] = chatKey.split('-');
        if (!userId1 || !userId2) return;

        const payload = tempId ? { ...message, tempId } : message;
        
        this.sendToUser(userId1, { type: 'newMessage', payload });
        this.sendToUser(userId2, { type: 'newMessage', payload });
    }

    public notifyNewFollower(followedId: string, follower: User) {
        console.log(`[WS Server] Notifying ${followedId} of new follower ${follower.name}`);
        this.sendToUser(followedId, { type: 'newFollower', payload: { follower } });
    }
    
    public broadcastFollowUpdate(roomId: string, follower: User, followed: User, isUnfollow: boolean) {
        const room = db.streamRooms.get(roomId);
        if (!room) return;
    
        const payload = { follower, followed, isUnfollow };
    
        room.forEach(userIdInRoom => {
            this.sendToUser(userIdInRoom, {
                type: 'followUpdate',
                payload
            });
        });
        console.log(`[WS Server] Broadcasted 'followUpdate' event in room ${roomId}.`);
    }

    public broadcastGlobalFollowUpdate(follower: User, followed: User, isUnfollow: boolean) {
        const payload = { follower, followed, isUnfollow };
        console.log(`[WS Server] Broadcasting global follow update.`);
        this.connections.forEach((_client, userId) => {
            this.sendToUser(userId, {
                type: 'followUpdate',
                payload
            });
        });
    }

    public sendDirectInvite(userId: string, streamId: string) {
        const stream = db.streamers.find((s: Streamer) => s.id === streamId);
        if (!stream) {
            console.error(`[WS Server] Cannot send invite, stream ${streamId} not found.`);
            return;
        }

        const inviter = db.users.get(stream.hostId);
        if (!inviter) {
            console.error(`[WS Server] Cannot send invite, inviter (host ${stream.hostId}) not found.`);
            return;
        }

        console.log(`[WS Server] Sending direct invite to user ${userId} for stream ${stream.name} from ${inviter.name}`);
        this.sendToUser(userId, {
            type: 'privateStreamInvite',
            payload: {
                streamId,
                hostId: stream.hostId, // Added hostId to help navigation
                streamName: stream.name,
                inviterName: inviter.name,
                inviterAvatar: inviter.avatarUrl
            }
        });
    }

    public sendCoHostInvite(inviteeId: string, payload: { inviter: User, stream: Streamer }) {
        console.log(`[WS Server] Sending co-host invite to ${inviteeId} from ${payload.inviter.name} for stream ${payload.stream.id}`);
        this.sendToUser(inviteeId, {
            type: 'coHostInvite',
            payload: payload,
        });
    }

    public notifyStreamerGoesLive(streamer: Streamer, isPrivate: boolean) {
        const streamerId = streamer.hostId;
        const fansSet = db.fans.get(streamerId);
        if (!fansSet) return;
    
        console.log(`[WS Server] Notifying fans that ${streamer.name} is live.`);
        
        const payload = {
            streamerId: streamerId,
            streamerName: streamer.name,
            streamerAvatar: streamer.avatar,
            isPrivate: isPrivate
        };
    
        fansSet.forEach(fanId => {
            if (this.connections.has(fanId)) {
                this.sendToUser(fanId, {
                    type: 'streamerLive',
                    payload: payload
                });
            }
        });
    }

    public broadcastMicStateUpdate(roomId: string, isMuted: boolean) {
        const room = db.streamRooms.get(roomId);
        if (!room) return;

        console.log(`[WS Server] Broadcasting mic state to room ${roomId}: ${isMuted}`);
        room.forEach(userIdInRoom => {
            this.sendToUser(userIdInRoom, {
                type: 'micStateUpdate',
                payload: { roomId, isMuted }
            });
        });
    }

    public broadcastSoundStateUpdate(roomId: string, isMuted: boolean) {
        const room = db.streamRooms.get(roomId);
        if (!room) return;

        console.log(`[WS Server] Broadcasting sound state to room ${roomId}: ${isMuted}`);
        room.forEach(userIdInRoom => {
            this.sendToUser(userIdInRoom, {
                type: 'soundStateUpdate',
                payload: { roomId, isMuted }
            });
        });
    }
    
    public broadcastAutoInviteStateUpdate(roomId: string, isEnabled: boolean) {
        const room = db.streamRooms.get(roomId);
        if (!room) return;

        console.log(`[WS Server] Broadcasting auto-invite state to room ${roomId}: ${isEnabled}`);
        room.forEach(userIdInRoom => {
            this.sendToUser(userIdInRoom, {
                type: 'autoInviteStateUpdate',
                payload: { roomId, isEnabled }
            });
        });
    }

    public broadcastPKHeartUpdate(roomId: string, heartsA: number, heartsB: number) {
        const room = db.streamRooms.get(roomId);
        if (!room) return;
    
        console.log(`[WS Server] Broadcasting PK heart update to room ${roomId}: A=${heartsA}, B=${heartsB}`);
        const payload = { roomId, heartsA, heartsB };
        room.forEach(userIdInRoom => {
            this.sendToUser(userIdInRoom, {
                type: 'pkHeartUpdate',
                payload
            });
        });
    }

    public updateAndBroadcastPresence(userId: string, isOnline: boolean) {
        const payload = { userId, isOnline, lastSeen: new Date().toISOString() };
        console.log(`[WS Server] Broadcasting presence update for ${userId}: ${isOnline ? 'online' : 'offline'}.`);
        this.connections.forEach((_client, connectedUserId) => {
            this.sendToUser(connectedUserId, {
                type: 'presenceUpdate',
                payload
            });
        });
    }

    public broadcastUserUpdate(updatedUser: User) {
        console.log(`[WS Server] Broadcasting user update for ${updatedUser.name} (${updatedUser.id}).`);
        const payload = { user: updatedUser };
        this.connections.forEach((_client, userId) => {
            this.sendToUser(userId, {
                type: 'userUpdate',
                payload
            });
        });
    }

    public broadcastTransactionUpdate(record: PurchaseRecord) {
        console.log(`[WS Server] Broadcasting transaction update for record ${record.id} to user ${record.userId}.`);
        const payload = { record };
        this.connections.forEach((_client, userId) => {
            this.sendToUser(userId, {
                type: 'transactionUpdate',
                payload
            });
        });
    }

    handleMessage(fromUserId: string, data: { type: string, payload: any, tempId?: string }) {
        console.log(`[WS Server] Message from ${fromUserId}:`, data);
        const { type, payload } = data;
        switch (type) {
            case 'sendMessage':
                this.handleSendMessage(fromUserId, payload.to, payload.text, data.tempId);
                break;
            case 'markAsRead':
                this.handleMarkAsRead(fromUserId, payload.messageIds, payload.otherUserId);
                break;
            case 'joinStreamRoom':
                this.handleJoinRoom(fromUserId, payload.roomId);
                break;
            case 'leaveStreamRoom':
                this.handleLeaveRoom(fromUserId, payload.roomId);
                break;
            case 'sendStreamMessage':
                this.handleSendStreamMessage(fromUserId, payload.roomId, payload.text);
                break;
            case 'sendStreamGift':
                this.handleSendStreamGift(fromUserId, payload.roomId, payload.gift, payload.quantity);
                break;
            case 'kickUser':
                this.handleKickUser(fromUserId, payload.userId, payload.roomId);
                break;
            case 'makeModerator':
                this.handleMakeModerator(fromUserId, payload.userId, payload.roomId);
                break;
        }
    }
    
    public broadcastRoomUpdate(roomId: string) {
        const roomConnections = db.streamRooms.get(roomId);
        if (!roomConnections) return;
    
        const allUserIds = Array.from(roomConnections);
        
        const session = db.liveSessions.get(roomId);

        const enrichedUsers = allUserIds.map(userId => {
            const user = db.users.get(userId);
            if (!user) return null;
    
            const contribution = session?.giftSenders?.get(userId)?.sessionContribution || 0;
    
            return {
                ...user,
                value: contribution 
            };
        }).filter((u): u is User & { value: number } => u !== null);
    
        enrichedUsers.sort((a, b) => b.value - a.value);
        
        const payload = { roomId, users: enrichedUsers, count: roomConnections.size };
    
        roomConnections.forEach(userIdInRoom => {
            this.sendToUser(userIdInRoom, {
                type: 'onlineUsersUpdate',
                payload
            });
        });
        console.log(`[WS Server] Broadcasted user update to room ${roomId}. Online users: ${roomConnections.size}`);
    }

    private handleJoinRoom(userId: string, roomId: string) {
        if (db.kickedUsers.get(roomId)?.has(userId)) {
            console.log(`[WS Server] Denied join for kicked user ${userId} in room ${roomId}.`);
            this.sendToUser(userId, { type: 'joinDenied', payload: { roomId } });
            return;
        }

        if (!db.streamRooms.has(roomId)) {
            db.streamRooms.set(roomId, new Set<string>());
        }
        db.streamRooms.get(roomId)!.add(userId);
        console.log(`[WS Server] User ${userId} joined room ${roomId}. Room size: ${db.streamRooms.get(roomId)!.size}`);
        this.broadcastRoomUpdate(roomId);
    }

    private handleLeaveRoom(userId: string, roomId: string) {
        const room = db.streamRooms.get(roomId);
        if (room) {
            room.delete(userId);
            console.log(`[WS Server] User ${userId} left room ${roomId}. Room size: ${room.size}`);
            this.broadcastRoomUpdate(roomId);
            if (room.size === 0) {
                db.streamRooms.delete(roomId);
                db.kickedUsers.delete(roomId); // Clear kicked list when room closes
                console.log(`[WS Server] Room ${roomId} is empty and has been deleted.`);
            }
        }
    }

    private handleKickUser(kickerId: string, kickedId: string, roomId: string) {
        const stream = db.streamers.find((s: Streamer) => s.id === roomId);
        const isHost = stream?.hostId === kickerId;
        const isModerator = db.moderators.get(roomId)?.has(kickerId);

        if (!stream || (!isHost && !isModerator)) {
            console.warn(`[WS Server] Unauthorized kick attempt by ${kickerId} in room ${roomId}`);
            return;
        }

        if (stream.hostId === kickedId) {
            console.warn(`[WS Server] Host cannot be kicked.`);
            return;
        }
        
        if (isModerator && (db.moderators.get(roomId)?.has(kickedId))) {
            console.warn(`[WS Server] Moderator cannot kick another moderator.`);
            return;
        }

        if (!db.kickedUsers.has(roomId)) {
            db.kickedUsers.set(roomId, new Set());
        }
        db.kickedUsers.get(roomId)!.add(kickedId);
        
        this.sendToUser(kickedId, { type: 'kicked', payload: { roomId } });
        
        this.handleLeaveRoom(kickedId, roomId);

        saveDb();
        console.log(`[WS Server] User ${kickedId} was kicked from room ${roomId} by ${kickerId}.`);
    }

    private handleMakeModerator(promoterId: string, targetId: string, roomId: string) {
        const stream = db.streamers.find((s: Streamer) => s.id === roomId);
        if (!stream || stream.hostId !== promoterId) {
            console.warn(`[WS Server] Unauthorized moderator promotion attempt by ${promoterId} in room ${roomId}`);
            return;
        }

        if (!db.moderators.has(roomId)) {
            db.moderators.set(roomId, new Set());
        }
        db.moderators.get(roomId)!.add(targetId);
        saveDb();
        console.log(`[WS Server] User ${targetId} is now a moderator in room ${roomId}.`);
    }

    private handleSendStreamMessage(fromUserId: string, roomId: string, text: string) {
        const fromUser = db.users.get(fromUserId);
        if (!fromUser) return;
    
        const room = db.streamRooms.get(roomId);
        if (!room) return;
    
        const stream = db.streamers.find((s: Streamer) => s.id === roomId);
        const isHost = stream?.hostId === fromUserId;
        const isModerator = db.moderators.get(roomId)?.has(fromUserId) || false;

        const messagePayload = {
            id: Date.now(),
            type: 'chat',
            user: fromUser.name,
            level: fromUser.level,
            message: text,
            avatar: fromUser.avatarUrl,
            gender: fromUser.gender,
            age: fromUser.age,
            isModerator: isHost || isModerator,
        };
    
        room.forEach(userIdInRoom => {
            const userSocket = this.connections.get(userIdInRoom);
            userSocket?.onMessage({
                type: 'newStreamMessage',
                payload: { ...messagePayload, roomId }
            });
        });
    }

    public handleSendStreamGift(fromUserId: string, roomId: string, gift: Gift, quantity: number) {
        const fromUser = db.users.get(fromUserId);
        const stream = db.streamers.find(s => s.id === roomId);
        const toUser = stream ? db.users.get(stream.hostId) : null;

        if (!fromUser || !toUser) {
            console.error(`[WS Server] Could not find fromUser ${fromUserId} or toUser for room ${roomId}`);
            return;
        }
    
        const room = db.streamRooms.get(roomId);
        if (!room) {
            console.error(`[WS Server] User ${fromUserId} could not send gift. Room ${roomId} not found.`);
            return;
        }
    
        const giftPayload = {
            fromUser,
            toUser: {
                id: toUser.id,
                name: toUser.name,
            },
            gift,
            quantity,
            roomId
        };
    
        console.log(`[WS Server] Broadcasting gift in room ${roomId}:`, giftPayload);
    
        room.forEach(userIdInRoom => {
            const userSocket = this.connections.get(userIdInRoom);
            userSocket?.onMessage({
                type: 'newStreamGift',
                payload: giftPayload
            });
        });
    }

    private handleSendMessage(from: string, to: string, text: string, tempId?: string) {
        const chatKey = createChatKey(from, to);
        const message: Message = {
            id: crypto.randomUUID(),
            chatId: chatKey,
            from,
            to,
            text,
            timestamp: new Date().toISOString(),
            status: this.connections.has(to) ? 'delivered' : 'sent',
        };
        db.messages.set(message.id, message);

        // Send to recipient if online
        const recipientSocket = this.connections.get(to);
        recipientSocket?.onMessage({ type: 'newMessage', payload: message });

        // Acknowledge sender with the final message object
        const senderSocket = this.connections.get(from);
        senderSocket?.onMessage({ type: 'messageAck', payload: { tempId, message } });
    }

    private handleMarkAsRead(readerId: string, messageIds: string[], otherUserId: string) {
        const updatedMessageIds: string[] = [];
        messageIds.forEach(id => {
            const msg = db.messages.get(id);
            if (msg && msg.to === readerId && msg.status !== 'read') {
                msg.status = 'read';
                updatedMessageIds.push(id);
            }
        });

        if (updatedMessageIds.length > 0) {
            // Notify the other user that messages have been read
            const otherUserSocket = this.connections.get(otherUserId);
            otherUserSocket?.onMessage({
                type: 'messageStatusUpdate',
                payload: { messageIds: updatedMessageIds, status: 'read' }
            });
        }
    }
}

// --- Client-Side WebSocket Manager ---
class WebSocketManager extends EventEmitter {
    private userId: string | null = null;
    private isConnected = false;

    connect(userId: string) {
        if (this.isConnected) return;
        this.userId = userId;
        this.isConnected = true;
        
        webSocketServerInstance.connect(userId, {
            onMessage: (data) => {
                this.emit(data.type, data.payload);
            }
        });
        console.log(`[WS Client] Connected for user: ${userId}`);
    }

    disconnect() {
        if (!this.isConnected || !this.userId) return;
        webSocketServerInstance.disconnect(this.userId);
        this.userId = null;
        this.isConnected = false;
        console.log('[WS Client] Disconnected.');
    }

    sendMessage(to: string, text: string, tempId: string) {
        if (!this.isConnected || !this.userId) return;
        webSocketServerInstance.handleMessage(this.userId, { type: 'sendMessage', payload: { to, text }, tempId });
    }

    markAsRead(messageIds: string[], otherUserId: string) {
        if (!this.isConnected || !this.userId) return;
        webSocketServerInstance.handleMessage(this.userId, { type: 'markAsRead', payload: { messageIds, otherUserId } });
    }

    joinStreamRoom(roomId: string) {
        if (!this.isConnected || !this.userId) return;
        webSocketServerInstance.handleMessage(this.userId, { type: 'joinStreamRoom', payload: { roomId } });
    }

    leaveStreamRoom(roomId: string) {
        if (!this.isConnected || !this.userId) return;
        webSocketServerInstance.handleMessage(this.userId, { type: 'leaveStreamRoom', payload: { roomId } });
    }

    sendStreamMessage(roomId: string, text: string) {
        if (!this.isConnected || !this.userId) return;
        webSocketServerInstance.handleMessage(this.userId, { type: 'sendStreamMessage', payload: { roomId, text } });
    }

    sendStreamGift(roomId: string, gift: Gift, quantity: number) {
        if (!this.isConnected || !this.userId) return;
        webSocketServerInstance.handleMessage(this.userId, { type: 'sendStreamGift', payload: { roomId, gift, quantity } });
    }

    sendKickRequest(roomId: string, userId: string, byUserId: string) {
        if (!this.isConnected || !this.userId) return;
        webSocketServerInstance.handleMessage(this.userId, { type: 'kickUser', payload: { roomId, userId, byUserId } });
    }

    sendModeratorRequest(roomId: string, userId: string, byUserId: string) {
        if (!this.isConnected || !this.userId) return;
        webSocketServerInstance.handleMessage(this.userId, { type: 'makeModerator', payload: { roomId, userId, byUserId } });
    }
}

const webSocketServerInstance = new SimulatedWebSocketServer();

export const webSocketManager = new WebSocketManager();
export { webSocketServerInstance };