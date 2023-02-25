class gameRoomRepository {
  constructor(mapBuilder) {
    this.gameRooms = {};
    this.maxPlayerCount = 2;
    this.mapBuilder = mapBuilder;
  }

  findOpenRoom() {
    let openRoomId = Object.keys(this.gameRooms).find((roomId) => {
      return !this.gameRooms[roomId].locked;
    });

    let isNew = false;
    if (!openRoomId) {
      openRoomId = this.createGameRoom();
      isNew = true;
    }

    return {
      roomId: openRoomId,
      isNew: isNew,
    };
  }

  addPlayer(newPlayer, roomId) {
    // const gameRoom = this.gameRooms[roomId];
    let gameRoomReady = false;

    this.gameRooms[roomId].players = [
      ...this.gameRooms[roomId].players,
      newPlayer,
    ];

    if (this.gameRooms[roomId].players.length >= this.maxPlayerCount) {
      console.log("addPlayer -> max player count reached");
      this.gameRooms[roomId].locked = true;
      this.gameRooms[roomId].status = "Ready";
      gameRoomReady = true;
    }

    return gameRoomReady;
  }

  isRoomReady(roomId) {
    return this.gameRooms[roomId].status === "Ready";
  }

  createMap(roomId) {
    console.log(`createMap: for ${roomId}`);

    /* @todo: Create a MapBuilder service */

    this.gameRooms[roomId].map = this.mapBuilder.getMap(
      5,
      4,
      this.gameRooms[roomId].players
    );
  }

  getGameRoom(roomId) {
    return this.gameRooms[roomId];
  }

  createGameRoom() {
    console.log(`createGameRoom`);

    var { randomUUID } = require("crypto");

    const newGameRoom = {
      roomId: randomUUID(),
      players: [],
      status: "WaitingForPlayers",
      locked: false,
    };

    this.gameRooms[newGameRoom.roomId] = newGameRoom;
    this.logRoomCount();
    return newGameRoom.roomId;
  }

  startGame(roomId) {
    console.log(`startGame: ${roomId}`);
    // this.gameRooms[roomId].status = "Started";
  }

  removePlayerFromRooms(playerId) {
    console.log(`removing ${playerId} from rooms...`);
    for (let room of Object.keys(this.gameRooms)) {
      let newPlayerList = this.gameRooms[room].players.filter(
        (player) => player.playerId !== playerId
      );

      this.gameRooms[room].players = [...newPlayerList];
      this.gameRooms[room].status = "WaitingDisconnectedPlayer";
    }
  }

  removeEmptyRooms() {
    console.log(`removing empty rooms...`);
    for (let room of Object.keys(this.gameRooms)) {
      if (this.gameRooms[room].players.length < 1) {
        delete this.gameRooms[room];
      }
    }
    this.logRoomCount();
  }

  logRoomCount() {
    console.log(`rooms: ${Object.keys(this.gameRooms).length}`);
  }
}

var mapBuilder = require("../maps/mapBuilder");
module.exports = new gameRoomRepository(mapBuilder);
