class playerPoolRepository {
  constructor() {
    this.playerPool = {};
  }

  getPlayerBySocketId(socketId) {
    return this.playerPool[socketId];
  }

  insert(socketId, playerInfo) {
    return (this.playerPool[socketId] = {
      playerId: socketId,
      color: playerInfo.color,
    });
  }

  assignRoom(playerId, roomId) {
    this.playerPool[playerId].assignedRoom = roomId;
  }

  removePlayer(playerId) {
    delete this.playerPool[playerId];
  }
}

module.exports = new playerPoolRepository();
