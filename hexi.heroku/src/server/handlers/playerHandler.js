module.exports = (io, socket, context) => {
  const initializePlayer = (playerInfo) => {
    console.log("player:initialize");

    // add player to pool
    const newPlayer = context.playerPool.insert(socket.id, playerInfo);
    console.log("newPlayer", newPlayer);

    // try to find open room
    let openRoom = context.gameRooms.findOpen();
    console.log("openRoom: ", openRoom);

    if (openRoom) {
      console.log("found one");

      // add player to room
      context.gameRooms.addPlayer(newPlayer, openRoom);
      context.gameRooms.createMap(openRoom);
      context.gameRooms.startGame(openRoom);
    } else {
      console.log("did not find one");

      const newGameRoom = context.gameRooms.createGameRoom();
      context.gameRooms.addPlayer(newPlayer, newGameRoom);
    }
  };

  const createPlayer = (payload) => {
    //
  };

  const readPlayer = (playerId, callback) => {
    //
  };

  socket.on("player:initialize", initializePlayer);
  socket.on("player:create", initializePlayer);
  socket.on("player:read", readPlayer);
};
