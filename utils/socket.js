let socket;

module.exports = {
    init: httpServer => {
        socket = require('socket.io')(httpServer);
        return socket;
    },
    getSocket: () => {
        if (!socket) {
            throw new Error('Socket.io not initialized!');
        }
        return socket;
    }
};