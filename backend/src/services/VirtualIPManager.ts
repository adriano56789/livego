import crypto from 'crypto';

// Gerador de ID simples sem dependência externa
function generateId(): string {
    return crypto.randomBytes(16).toString('hex').substring(0, 8);
}

export interface VirtualUser {
    userId: string;
    virtualIP: string;
    realIP: string;
    socketIds: Set<string>;
    currentRoom?: string;
    joinedAt: Date;
    lastSeen: Date;
}

export interface VirtualRoom {
    roomId: string;
    streamId: string;
    hostId: string;
    roomCode: string;
    participants: Map<string, VirtualUser>; // virtualIP -> VirtualUser
    createdAt: Date;
    isActive: boolean;
}

export class VirtualIPManager {
    private virtualUsers: Map<string, VirtualUser> = new Map(); // userId -> VirtualUser
    private virtualRooms: Map<string, VirtualRoom> = new Map(); // roomId -> VirtualRoom
    private ipToUser: Map<string, string> = new Map(); // virtualIP -> userId

    /**
     * Gera um IP virtual único para o usuário
     * Formato: 192.168.XXX.XXX (únicos para cada sessão)
     */
    private generateVirtualIP(): string {
        // Gera um IP virtual no range 192.168.100.0/24
        const subnet = 100;
        const host = Math.floor(Math.random() * 254) + 1; // 1-254
        return `192.168.${subnet}.${host}`;
    }

    /**
     * Gera um código de sala único
     * Formato: ABC-DEF (6 caracteres alfanuméricos)
     */
    private generateRoomCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            if (i === 3) code += '-'; // Adiciona hífen no meio
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Registra um usuário com IP virtual
     */
    registerUser(userId: string, realIP: string, socketId: string): VirtualUser {
        let virtualUser = this.virtualUsers.get(userId);
        
        if (!virtualUser) {
            // Novo usuário - gerar IP virtual
            let virtualIP = this.generateVirtualIP();
            
            // Garantir que o IP virtual seja único
            while (this.ipToUser.has(virtualIP)) {
                virtualIP = this.generateVirtualIP();
            }

            virtualUser = {
                userId,
                virtualIP,
                realIP,
                socketIds: new Set([socketId]),
                joinedAt: new Date(),
                lastSeen: new Date()
            };

            this.virtualUsers.set(userId, virtualUser);
            this.ipToUser.set(virtualIP, userId);
        } else {
            // Usuário existente - adicionar socket
            virtualUser.socketIds.add(socketId);
            virtualUser.lastSeen = new Date();
            virtualUser.realIP = realIP; // Atualiza IP real se mudou
        }

        return virtualUser;
    }

    /**
     * Remove um socket de um usuário
     */
    removeSocket(userId: string, socketId: string): boolean {
        const user = this.virtualUsers.get(userId);
        if (!user) return false;

        user.socketIds.delete(socketId);
        user.lastSeen = new Date();

        // Se não tiver mais sockets, remover usuário
        if (user.socketIds.size === 0) {
            this.removeUser(userId);
            return true;
        }

        return false;
    }

    /**
     * Remove completamente um usuário
     */
    removeUser(userId: string): void {
        const user = this.virtualUsers.get(userId);
        if (!user) return;

        // Remover da sala atual se estiver em alguma
        if (user.currentRoom) {
            this.leaveRoom(userId, user.currentRoom);
        }

        // Limpar mapeamentos
        this.ipToUser.delete(user.virtualIP);
        this.virtualUsers.delete(userId);
    }

    /**
     * Cria uma nova sala virtual
     */
    createRoom(streamId: string, hostId: string): VirtualRoom {
        const roomId = generateId();
        const roomCode = this.generateRoomCode();

        // Garantir que o código da sala seja único
        let existingRoom = Array.from(this.virtualRooms.values())
            .find(room => room.roomCode === roomCode);
        
        let finalRoomCode = roomCode;
        while (existingRoom) {
            const newCode = this.generateRoomCode();
            existingRoom = Array.from(this.virtualRooms.values())
                .find(room => room.roomCode === newCode);
            if (!existingRoom) {
                finalRoomCode = newCode;
                break;
            }
        }

        const room: VirtualRoom = {
            roomId,
            streamId,
            hostId,
            roomCode: finalRoomCode,
            participants: new Map(),
            createdAt: new Date(),
            isActive: true
        };

        this.virtualRooms.set(roomId, room);
        return room;
    }

    /**
     * Entrar em uma sala virtual
     */
    joinRoom(userId: string, roomId: string): boolean {
        const user = this.virtualUsers.get(userId);
        const room = this.virtualRooms.get(roomId);

        if (!user || !room || !room.isActive) {
            return false;
        }

        // Sair da sala anterior se estiver em alguma
        if (user.currentRoom && user.currentRoom !== roomId) {
            this.leaveRoom(userId, user.currentRoom);
        }

        // Entrar na nova sala
        user.currentRoom = roomId;
        room.participants.set(user.virtualIP, user);

        return true;
    }

    /**
     * Sair de uma sala virtual
     */
    leaveRoom(userId: string, roomId: string): boolean {
        const user = this.virtualUsers.get(userId);
        const room = this.virtualRooms.get(roomId);

        if (!user || !room) {
            return false;
        }

        // Remover usuário da sala
        room.participants.delete(user.virtualIP);
        user.currentRoom = undefined;

        // Se a sala ficar vazia e não for o host, desativar
        if (room.participants.size === 0) {
            room.isActive = false;
        }

        return true;
    }

    /**
     * Encerra uma sala (quando a transmissão termina)
     */
    endRoom(roomId: string): void {
        const room = this.virtualRooms.get(roomId);
        if (!room) return;

        // Remover todos os participantes da sala
        room.participants.forEach((user) => {
            user.currentRoom = undefined;
        });

        // Desativar sala
        room.isActive = false;
        this.virtualRooms.delete(roomId);
    }

    /**
     * Obtém informações de um usuário pelo ID
     */
    getUser(userId: string): VirtualUser | undefined {
        return this.virtualUsers.get(userId);
    }

    /**
     * Obtém informações de um usuário pelo IP virtual
     */
    getUserByVirtualIP(virtualIP: string): VirtualUser | undefined {
        const userId = this.ipToUser.get(virtualIP);
        return userId ? this.virtualUsers.get(userId) : undefined;
    }

    /**
     * Obtém informações de uma sala
     */
    getRoom(roomId: string): VirtualRoom | undefined {
        return this.virtualRooms.get(roomId);
    }

    /**
     * Obtém sala pelo código
     */
    getRoomByCode(roomCode: string): VirtualRoom | undefined {
        return Array.from(this.virtualRooms.values())
            .find(room => room.roomCode === roomCode && room.isActive);
    }

    /**
     * Obtém sala pelo streamId
     */
    getRoomByStreamId(streamId: string): VirtualRoom | undefined {
        return Array.from(this.virtualRooms.values())
            .find(room => room.streamId === streamId && room.isActive);
    }

    /**
     * Lista todos os participantes de uma sala com seus IPs virtuais
     */
    getRoomParticipants(roomId: string): Array<{ userId: string; virtualIP: string; joinedAt: Date }> {
        const room = this.virtualRooms.get(roomId);
        if (!room) return [];

        return Array.from(room.participants.values()).map(user => ({
            userId: user.userId,
            virtualIP: user.virtualIP,
            joinedAt: user.joinedAt
        }));
    }

    /**
     * Verifica se um usuário está em uma sala
     */
    isUserInRoom(userId: string, roomId: string): boolean {
        const user = this.virtualUsers.get(userId);
        return user?.currentRoom === roomId;
    }

    /**
     * Obtém estatísticas do sistema
     */
    getStats(): {
        totalUsers: number;
        activeRooms: number;
        totalConnections: number;
    } {
        const totalConnections = Array.from(this.virtualUsers.values())
            .reduce((total, user) => total + user.socketIds.size, 0);

        return {
            totalUsers: this.virtualUsers.size,
            activeRooms: Array.from(this.virtualRooms.values())
                .filter(room => room.isActive).length,
            totalConnections
        };
    }

    /**
     * Limpeza de usuários inativos (mais de 30 minutos)
     */
    cleanupInactiveUsers(): void {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        this.virtualUsers.forEach((user, userId) => {
            if (user.lastSeen < thirtyMinutesAgo && user.socketIds.size === 0) {
                this.removeUser(userId);
            }
        });
    }
}

// Instância global do gerenciador
export const virtualIPManager = new VirtualIPManager();
