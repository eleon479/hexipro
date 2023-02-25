module.exports = (io, socket) => {
  const createGame = (payload) => {
    // ...
  };

  const readGame = (gameId, callback) => {
    // ...
  };

  const updateGame = (x) => {
    console.log("updateGame, x: ");
    console.log(x);
  };

  socket.on("game:create", createGame);
  socket.on("game:read", readGame);

  // current raw updates
  socket.on("game:update", updateGame);
};
