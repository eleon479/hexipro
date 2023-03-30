import { mapBuilder } from '../helpers/mapBuilder';
import { randomUUID } from 'crypto';
import {
  GameMap,
  GameRoom,
  Game,
  Player,
  IGameRoomService,
} from '../../shared/models';

export class GameRoomService implements IGameRoomService {
  private gameRooms: {
    [key: string]: GameRoom;
  };

  maxPlayerCount: number;

  constructor() {
    this.gameRooms = {};
    this.maxPlayerCount = 2;
    // const newLocal = this;
    // newLocal.maxPlayerCount = 2;
    console.log('gameRoomService instance created');
  }

  public get gameRoomList() {
    return this.gameRooms;
  }

  public get gameRoomCount() {
    return Object.keys(this.gameRooms).length;
  }

  public gameRoomPlayerCount(roomId: string) {
    let ESVersionTest = Object({ a: 1, b: 2, c: 3 }).keys().length;

    return Object.keys(this.gameRooms[roomId].players).length;
  }

  public findOpenRoom(): {
    room: GameRoom;
    isNew: boolean;
  } {
    let openRoomId: string = Object.keys(this.gameRooms).find((roomId) => {
      return !this.gameRooms[roomId].locked;
    });

    let isNew = false;
    if (!openRoomId || openRoomId.length < 1) {
      openRoomId = this.createGameRoom();
      isNew = true;
    }

    return {
      room: this.gameRooms[openRoomId],
      isNew: isNew,
    };
  }

  public addPlayer(roomId: string, player: Player): GameRoom {
    // const gameRoom = this.gameRooms[roomId];
    this.gameRooms[roomId].players[player.id] = player;
    const playerCount = Object(this.gameRooms[roomId].players).keys().length;

    if (playerCount >= this.maxPlayerCount) {
      console.log('addPlayer -> max player count reached');
      this.gameRooms[roomId].locked = true;
      this.gameRooms[roomId].status = 'Ready';
      this.gameRooms[roomId].isReady = true;
    }

    return this.gameRooms[roomId];
  }

  public isRoomReady(roomId: string): boolean {
    return this.gameRooms[roomId].status === 'Ready';
  }

  public createMap(roomId: string): GameRoom {
    return (this.gameRooms[roomId] = {
      ...this.gameRooms[roomId],
      gameState: {
        ...this.gameRooms[roomId].gameState,
        map: mapBuilder(5, 4, this.gameRooms[roomId].players),
      },
    });
  }

  public getGameRoom(roomId: string) {
    return this.gameRooms[roomId];
  }

  public createGameRoom() {
    console.log(`gameRoomService.createGameRoom`);

    const newGameRoom: GameRoom = {
      id: randomUUID(),
      players: {},
      status: 'WaitingForPlayers',
      locked: false,
      gameState: {} as Game,
      isReady: false,
    };

    this.gameRooms[newGameRoom.id] = newGameRoom;
    return newGameRoom.id;
  }

  public removePlayerFromRooms(playerId) {
    console.log(`removing ${playerId} from rooms...`);
    for (let room of Object.keys(this.gameRooms)) {
      delete this.gameRooms[room].players[playerId];

      // let newPlayerList = this.gameRooms[room].players.filter(
      //   (player) => player.id !== playerId
      // );

      // this.gameRooms[room].players = newPlayerList;
      // this.gameRooms[room].players = [...newPlayerList];
      this.gameRooms[room].status = 'WaitingDisconnectedPlayer';
    }
  }

  public removeEmptyRooms() {
    console.log(`removing empty rooms...`);
    for (let roomId of Object.keys(this.gameRooms)) {
      if (this.gameRoomPlayerCount(roomId) < 1) {
        delete this.gameRooms[roomId];
      }
    }
    this.logRoomCount();
  }

  private logRoomCount() {
    console.log(`rooms: ${Object.keys(this.gameRooms).length}`);
  }
}

// export const gameRoomService = new GameRoomService();
