module.exports = (io, socket) => {
  const createGame = (payload) => {
    // ...
  };

  const readGame = (gameId, callback) => {
    // ...
  };

  socket.on("game:create", createGame);
  socket.on("game:read", readGame);
};
