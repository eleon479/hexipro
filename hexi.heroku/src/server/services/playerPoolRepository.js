class playerPoolRepository {
  constructor() {
    this.playerPool = {};
  }

  insert(socketId, playerInfo) {
    return (this.playerPool[socketId] = {
      playerId: socketId,
      color: playerInfo.color,
    });
  }
}

module.exports = new playerPoolRepository();
