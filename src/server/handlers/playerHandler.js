module.exports = (io, socket, context) => {
  const findGame = (playerInfo) => {
    console.log("player:findGame");

    // add player to pool
    const newPlayer = context.playerPool.insert(socket.id, playerInfo);
    console.log("newPlayer", newPlayer);
    socket.emit("player.created", newPlayer);

    // try to find open room
    const { roomId, isNew } = context.gameRooms.findOpenRoom();

    if (isNew) {
      console.log(`did not find open room. created: ${roomId}`);
    } else {
      console.log(`found open room ${roomId}`);
    }

    context.playerPool.assignRoom(newPlayer.playerId, roomId);
    context.gameRooms.addPlayer(newPlayer, roomId);

    // let the current connection know to listen into assigned room
    socket.join(roomId);

    // tell everyone in the room this player joined
    socket.to(roomId).emit("player.connected", newPlayer.playerId);

    // @todo move to gameHandler
    if (context.gameRooms.isRoomReady(roomId)) {
      context.gameRooms.createMap(roomId);
      console.log("game.ready");
      io.to(roomId).emit("game.ready", context.gameRooms.getGameRoom(roomId));
    } else {
      console.log("game.findingEnemy");
      io.to(roomId).emit(
        "game.findingEnemy",
        context.gameRooms.getGameRoom(roomId)
      );
    }
  };

  const disconnectPlayer = () => {
    console.log(`player ${socket.id} disconnected`);
    let playerId = context.playerPool.getPlayerBySocketId(socket.id);

    if (playerId) {
      context.gameRooms.removePlayerFromRooms(socket.id);
      context.gameRooms.removeEmptyRooms();
      context.playerPool.removePlayer(socket.id);
    } else {
      console.log("can't remove nonexistent player?");
    }
  };

  const disconnectPlayerFromRooms = () => {
    console.log(`player ${socket.id} disconnecting...`);
    let playerId = context.playerPool.getPlayerBySocketId(socket.id);

    socket.rooms.forEach((room) =>
      io.to(room).emit("player:disconnect", socket.id)
    );
  };
  
  const clickTile = (event) => {
    // click tile logic
    // take in the event and perform necessary
    // changes to the state
    // delegate to a new MapService if necessary
  };

  const endAttack = (event) => {
    // have some logic check incoming event against internal server
    // state. if time allows
    // realistically tho:
    // if all is good, just make sure to update the
    // server state and have those changes propagate?
  };
  const endTurn = (event) => {};

  /*
  @todo: 
  
  - break down initialize
  - handlers:
  
  1) :init - insert client into player pool (map socket.id <=> player.id)
    @emit playerId
    !save in localstorage for next connect
  2) :seek - look for open rooms or create a new room + add client to room
    @join roomId
    @broadcast(roomId, playerIds?)
  3) :rejoin - try to reconnect client (w/ playerId) to their last room
    @join roomId
    @broadcast(roomId, playerIds?)

    further: (differentiate on client based on if they have a localStorage
      "playerId" item, no real auth for now)

    player:
      new:
        init => playerId
      existing:
        findGame {playerId} => roomId
        createGame {playerId} => roomId
        rejoinGame {playerId, lastRoomId} => roomId
  */
  socket.on("player:findGame", findGame);
  socket.on("player:clickTile", clickTile);
  socket.on("player:endAttack", endAttack);
  socket.on("player:endTurn", endTurn);
  socket.on("disconnect", disconnectPlayer);
  socket.on("disconnecting", disconnectPlayerFromRooms);
};
