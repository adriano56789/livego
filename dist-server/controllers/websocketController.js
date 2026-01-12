const rooms = {};
export const setupWebSocket = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;
        console.log(`[WS] ✔️  Cliente conectado: ${userId} (Socket ID: ${socket.id})`);
        const findUserRoom = (socketId) => {
            for (const streamId in rooms) {
                if (rooms[streamId].participants.has(socketId)) {
                    return streamId;
                }
            }
            return null;
        };
        socket.on('join:stream', ({ streamId, user }) => {
            if (!streamId || !user)
                return;
            socket.join(streamId);
            if (!rooms[streamId])
                rooms[streamId] = { participants: new Map() };
            rooms[streamId].participants.set(socket.id, user);
            console.log(`[WS] 🚪 ${user.name} entrou na sala: ${streamId}`);
            socket.to(streamId).emit('user:joined', user);
            io.to(streamId).emit('user:status', { userId: user.id, status: 'online' });
            io.to(streamId).emit('onlineUsersUpdate', { roomId: streamId });
        });
        socket.on('leave:stream', ({ streamId, userId }) => {
            socket.leave(streamId);
            if (rooms[streamId]) {
                rooms[streamId].participants.delete(socket.id);
                io.to(streamId).emit('user:left', { userId });
                io.to(streamId).emit('user:status', { userId, status: 'offline' });
                io.to(streamId).emit('onlineUsersUpdate', { roomId: streamId });
            }
        });
        socket.on('stream:started', (streamData) => {
            io.emit('stream:started', streamData);
        });
        socket.on('stream:ended', ({ streamId }) => {
            io.emit('stream:ended', { streamId });
            if (rooms[streamId])
                delete rooms[streamId];
        });
        socket.on('disconnect', () => {
            const streamId = findUserRoom(socket.id);
            if (streamId && rooms[streamId]) {
                const user = rooms[streamId].participants.get(socket.id);
                rooms[streamId].participants.delete(socket.id);
                if (user) {
                    io.to(streamId).emit('user:left', { userId: user.id });
                    io.to(streamId).emit('user:status', { userId: user.id, status: 'offline' });
                    io.to(streamId).emit('onlineUsersUpdate', { roomId: streamId });
                }
            }
        });
    });
};
