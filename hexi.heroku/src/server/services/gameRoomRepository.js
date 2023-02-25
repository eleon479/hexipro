class gameRoomRepository {
  constructor(mapBuilder) {
    this.gameRooms = {};
    this.maxPlayerCount = 2;
    this.mapBuilder = mapBuilder;
  }

  findOpen() {
    return (
      Object.keys(this.gameRooms).find((roomId) => !rooms[roomId].locked) ||
      false
    );
  }

  addPlayer(newPlayer, roomId) {
    // const gameRoom = this.gameRooms[roomId];
    let gameRoomReady = false;

    this.gameRooms[roomId].players = [
      ...this.gameRooms[roomId].players,
      newPlayer,
    ];

    if (this.gameRooms[roomId].players.length >= this.maxPlayerCount) {
      this.gameRooms[roomId].locked = true;
      this.gameRooms[roomId].status = "Ready";
      gameRoomReady = true;
    }

    return gameRoomReady;
  }

  createGameRoom() {
    console.log(`createGameRoom`);

    const newGameRoom = {
      roomId: randomUUID(),
      players: [],
      status: "WaitingForPlayers",
      locked: false,
    };

    this.gameRooms[newGameRoom.roomId] = newGameRoom;
    return newGameRoom.roomId;
  }

  createMap(roomId) {
    console.log(`stub: createMap: ${roomId}`);

    /* @todo: Create a MapBuilder service */

    this.gameRooms[roomId].map = this.mapBuilder.getMap();
  }

  startGame(roomId) {
    console.log(`stub: startGame: ${roomId}`);
  }

  removePlayerFromAllRooms(playerId) {
    for (let room of Object.keys(this.gameRooms)) {
      let newPlayerList = this.gameRooms[room].players.filter(
        (player) => player.playerId !== playerId
      );

      this.gameRooms[room].players = [...newPlayerList];
    }
  }

  removeEmpty() {
    for (let room of Object.keys(this.gameRooms)) {
      if (this.gameRooms[room].players.length < 1) {
        delete this.gameRooms[room];
      }
    }
  }
}

var mapBuilder = require("../maps/mapBuilder");
module.exports = new gameRoomRepository(mapBuilder);
