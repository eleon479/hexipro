import { GameRoom, Player } from '../types/models';

export class PlayerService {
  private players: {
    [id: string]: Player;
  };

  constructor() {
    this.players = {};
    // console.log('PlayerService instance created');
  }

  public get playerList() {
    return this.players;
  }

  getPlayerBySocketId(socketId) {
    return this.players[socketId];
  }

  insert(socketId, playerInfo): Player {
    return (this.players[socketId] = {
      id: socketId,
      color: playerInfo.color,
      assignedRoom: '',
      gameState: {
        availablePower: 0,
      },
    });
  }

  assignRoom(playerId, room: GameRoom) {
    return (this.players[playerId] = {
      ...this.players[playerId],
      assignedRoom: room.id,
    });
  }

  removePlayer(playerId) {
    delete this.players[playerId];
  }
}

// export const playerService = new PlayerService();
