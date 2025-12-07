
import * as database from './database';
import { Message, User, Gift, Streamer, EligibleUser, PurchaseRecord } from '../types';
import { api } from './api';

// Safe database accessor function
const getDatabase = () => {
    try {
        return (database as any).db;
    } catch (error) {
        return null;
    }
};

// Initialize maps when needed
const ensureMapsInitialized = () => {
    const db = getDatabase();
    if (!db) return;

    if (!db.kickedUsers) {
        db.kickedUsers = new Map<string, Set<string>>();
    }
    if (!db.moderators) {
        db.moderators = new Map<string, Set<string>>();
    }
};

// Lazy initialization - will be called when first needed
let mapsInitialized = false;
const initializeMapsIfNeeded = () => {
    if (mapsInitialized) return;

    const db = getDatabase();
    if (db) {
        ensureMapsInitialized();
        mapsInitialized = true;
    }
};

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
        // Prevent duplicate listeners
        const listeners = this.events.get(event)!;
        if (!listeners.includes(listener)) {
            listeners.push(listener);
        }
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
    private lastBroadcast = new Map<string, number>(); // Track last broadcast time per user

    connect(userId: string, client: { onMessage: (data: any) => void }) {
        console.log(`[WS Server] User connected: ${userId}`);
        this.connections.set(userId, client);
    }

    disconnect(userId: string) {
        console.log(`[WS Server] User disconnected: ${userId}`);
        this.connections.delete(userId);
        // Also remove user from any rooms they were in
        database.db.streamRooms.forEach((users, roomId) => {
            if (users.has(userId)) {
                this.handleLeaveRoom(userId, roomId as string);
            }
        });
    }

    emit(event: string, data: any) {
        console.log(`[WS Server] Emitting event: ${event}`, data);
        // Notificar todos os clientes conectados
        this.connections.forEach(client => {
            if (client.onMessage) {
                client.onMessage({ type: event, ...data });
            }
        });
    }

    private sendToUser(userId: string, data: { type: string, payload: any }) {
        const userSocket = this.connections.get(userId);
        if (userSocket) {
            userSocket.onMessage(data);
            console.log(`[WS Server] Sent direct message to ${userId}:`, data);
        }
    }

    /**
     * Envia uma mensagem para todos os clientes conectados
     * @param event Nome do evento
     * @param data Dados a serem enviados
     */
    public broadcast(event: string, data: any) {
        console.log(`[WS Server] Broadcasting '${event}' to all clients`);
        this.connections.forEach((client, userId) => {
            try {
                client.onMessage({
                    type: event,
                    payload: data
                });
                console.log(`[WS Server] Broadcast sent to user ${userId}`);
            } catch (error) {
                console.error(`[WS Server] Error sending broadcast to user ${userId}:`, error);
            }
        });
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
        const room = database.db.streamRooms.get(roomId);
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

    public sendPrivateInvite(userId: string, payload: { stream: Streamer }) {
        console.log(`[WS Server] Sending private invite to ${userId} for stream ${payload.stream.id}`);
        this.sendToUser(userId, {
            type: 'privateStreamInvite',
            payload: payload,
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
        const fansSet = database.db.fans.get(streamerId);
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
        const room = database.db.streamRooms.get(roomId);
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
        const room = database.db.streamRooms.get(roomId);
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
        const room = database.db.streamRooms.get(roomId);
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
        const room = database.db.streamRooms.get(roomId);
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

    public async broadcastUserUpdate(updatedUser: User) {
        const now = Date.now();
        const lastTime = this.lastBroadcast.get(updatedUser.id) || 0;

        // Throttle updates to prevent double broadcasting (500ms window)
        if (now - lastTime < 500) {
            console.log(`[WS Server] Skipping duplicate broadcast for ${updatedUser.name} (${updatedUser.id}).`);
            return;
        }

        this.lastBroadcast.set(updatedUser.id, now);

        console.log(`[WS Server] Broadcasting user update for ${updatedUser.name} (${updatedUser.id}).`);
        const payload = { user: updatedUser };
        this.connections.forEach((_client, userId) => {
            this.sendToUser(userId, {
                type: 'userUpdate',
                payload
            });
        });
    }

    public notifyUserUpdate(userId: string) {
        const user = database.db.users.get(userId);
        if (user) {
            console.log(`[WS Server] Notifying user ${user.name} (${userId}) of data update.`);
            this.sendToUser(userId, {
                type: 'userDataUpdated',
                payload: { user }
            });
        } else {
            console.warn(`[WS Server] Could not notify user ${userId}: user not found.`);
        }
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
            // Gift handling has been moved to the API
            case 'kickUser':
                this.handleKickUser(fromUserId, payload.userId, payload.roomId);
                break;
            case 'makeModerator':
                this.handleMakeModerator(fromUserId, payload.userId, payload.roomId);
                break;
        }
    }

    public broadcastRoomUpdate(roomId: string) {
        const roomConnections = database.db.streamRooms.get(roomId);
        if (!roomConnections) return;

        const allUserIds = Array.from(roomConnections);

        const session = database.db.liveSessions.get(roomId);

        const enrichedUsers = allUserIds.map(userId => {
            const user = database.db.users.get(userId);
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
        if (database.db.kickedUsers.get(roomId)?.has(userId)) {
            console.log(`[WS Server] Denied join for kicked user ${userId} in room ${roomId}.`);
            this.sendToUser(userId, { type: 'joinDenied', payload: { roomId } });
            return;
        }

        if (!database.db.streamRooms.has(roomId)) {
            database.db.streamRooms.set(roomId, new Set<string>());
        }
        database.db.streamRooms.get(roomId)!.add(userId);
        console.log(`[WS Server] User ${userId} joined room ${roomId}. Room size: ${database.db.streamRooms.get(roomId)!.size}`);
        this.broadcastRoomUpdate(roomId);
    }

    private handleLeaveRoom(userId: string, roomId: string) {
        const room = database.db.streamRooms.get(roomId);
        if (room) {
            room.delete(userId);
            console.log(`[WS Server] User ${userId} left room ${roomId}. Room size: ${room.size}`);
            this.broadcastRoomUpdate(roomId);
            if (room.size === 0) {
                database.db.streamRooms.delete(roomId);
                database.db.kickedUsers.delete(roomId); // Clear kicked list when room closes
                console.log(`[WS Server] Room ${roomId} is empty and has been deleted.`);
            }
        }
    }

    private handleKickUser(kickerId: string, kickedId: string, roomId: string) {
        const stream = database.db.streamers.find((s: Streamer) => s.id === roomId);
        const isHost = stream?.hostId === kickerId;
        const isModerator = database.db.moderators.get(roomId)?.has(kickerId);

        if (!stream || (!isHost && !isModerator)) {
            console.warn(`[WS Server] Unauthorized kick attempt by ${kickerId} in room ${roomId}`);
            return;
        }

        if (stream.hostId === kickedId) {
            console.warn(`[WS Server] Host cannot be kicked.`);
            return;
        }

        if (isModerator && (database.db.moderators.get(roomId)?.has(kickedId))) {
            console.warn(`[WS Server] Moderator cannot kick another moderator.`);
            return;
        }

        if (!database.db.kickedUsers.has(roomId)) {
            database.db.kickedUsers.set(roomId, new Set());
        }
        database.db.kickedUsers.get(roomId)!.add(kickedId);

        this.sendToUser(kickedId, { type: 'kicked', payload: { roomId } });

        this.handleLeaveRoom(kickedId, roomId);

        database.saveDb();
        console.log(`[WS Server] User ${kickedId} was kicked from room ${roomId} by ${kickerId}.`);
    }

    private handleMakeModerator(promoterId: string, targetId: string, roomId: string) {
        const stream = database.db.streamers.find((s: Streamer) => s.id === roomId);
        if (!stream || stream.hostId !== promoterId) {
            console.warn(`[WS Server] Unauthorized moderator promotion attempt by ${promoterId} in room ${roomId}`);
            return;
        }

        if (!database.db.moderators.has(roomId)) {
            database.db.moderators.set(roomId, new Set());
        }
        database.db.moderators.get(roomId)!.add(targetId);
        database.saveDb();
        console.log(`[WS Server] User ${targetId} is now a moderator in room ${roomId}.`);
    }

    private handleSendStreamMessage(fromUserId: string, roomId: string, text: string) {
        const fromUser = database.db.users.get(fromUserId);
        if (!fromUser) return;

        const room = database.db.streamRooms.get(roomId);
        if (!room) return;

        const stream = database.db.streamers.find((s: Streamer) => s.id === roomId);
        const isHost = stream?.hostId === fromUserId;
        const isModerator = database.db.moderators.get(roomId)?.has(fromUserId) || false;

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

    // Gift handling has been moved to the API

    private handleSendMessage(from: string, to: string, text: string, tempId?: string) {
        const chatKey = database.createChatKey(from, to);
        const fromUser = database.db.users.get(from);

        const message: Message = {
            id: crypto.randomUUID(),
            chatId: chatKey,
            from,
            to,
            text,
            timestamp: new Date().toISOString(),
            status: this.connections.has(to) ? 'delivered' : 'sent',
            avatarUrl: fromUser?.avatarUrl || '',
            username: fromUser?.name || '',
            badgeLevel: fromUser?.level || 0
        };
        database.db.messages.set(String(message.id), message);

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
            const msg = database.db.messages.get(id);
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

    private giftQueue: Array<() => Promise<boolean>> = [];
    private isProcessingGift = false;

    private async processGiftQueue() {
        if (this.isProcessingGift || this.giftQueue.length === 0) return;

        this.isProcessingGift = true;
        const giftTask = this.giftQueue.shift();

        if (giftTask) {
            try {
                await giftTask();
            } catch (error) {
                console.error('Erro ao processar presente na fila:', error);
            }
        }

        this.isProcessingGift = false;

        // Processa o próximo item da fila se houver
        if (this.giftQueue.length > 0) {
            requestAnimationFrame(() => this.processGiftQueue());
        }
    }

    async sendStreamGift(roomId: string, gift: Gift, quantity: number): Promise<boolean> {
        if (!this.userId) return false;

        return new Promise((resolve) => {
            const processGift = async (): Promise<boolean> => {
                try {
                    await api.sendGift(this.userId!, roomId, gift.name, quantity);
                    resolve(true);
                    return true;
                } catch (error) {
                    console.error('Erro ao enviar presente:', error instanceof Error ? error.message : 'Erro desconhecido');
                    resolve(false);
                    return false;
                }
            };

            this.giftQueue.push(processGift);

            if (!this.isProcessingGift) {
                requestAnimationFrame(() => this.processGiftQueue());
            }
        });
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
