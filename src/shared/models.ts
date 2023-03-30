export interface IGameRoomService {
  gameRoomList: { [key: string]: GameRoom };
  findOpenRoom(): { room: GameRoom; isNew: boolean };
  addPlayer(roomId: string, player: Player): GameRoom;
  isRoomReady(roomId: string): boolean;
  removePlayerFromRooms(playerId: string): void;
  removeEmptyRooms(): void;
  createMap(roomId: string): GameRoom;
  getGameRoom(roomId: string): GameRoom;
  createGameRoom(): string;
  gameRoomPlayerCount(roomId: string): number;
}

export interface IPlayerService {
  getPlayerBySocketId(socketId: string): Player;
  insert(socketId: string, playerInfo: PlayerInfo): Player;
  assignRoom(playerId: string, room: GameRoom): Player;
  removePlayer(playerId: string): void;
  playerList: { [id: string]: Player };
}

export type ServerContext = {
  gameRoomService: IGameRoomService;
  playerService: IPlayerService;
};

export type Player = {
  id: string;
  color: string;
  assignedRoom: string;
  gameState: {
    availablePower: number;
  };
};

export type PlayerInfo = {
  name?: string;
  color: string;
};

export type GameRoom = {
  id: string;
  players: { [id: string]: Player };
  status: string;
  locked: boolean;
  gameState: Game;
  isReady: boolean;
};

export type Game = {
  map: GameMap;
  stage: Stage;
  currentPlayer: Player;
  currentAttackNodeSelected: boolean;
  currentAttackNodeColumn: number;
  currentAttackNodeRow: number;
  currentAttackNodePower: number;
};

export enum Stage {
  Attack = 'Attack',
  Allocate = 'Allocate',
}

export type GameMap = {
  size: number;
  columns: number;
  rows: number;
  tiles: GameTile[][];
};

export type GameTile = {
  id: string;
  x: number;
  y: number;
  type: string;
  color: string;
  player: Player | null;
  power: number;
  active: boolean;
};

export type ClientAction = {
  type: ClientActionType;
  data: any;
};

export enum ClientActionType {
  FindGame = 'player:findGame',
  ClickTile = 'player:clickTile',
  EndTurn = 'player:endTurn',
  EndAttack = 'player:endAttack',
}

export type ServerEvent = {
  type: ServerEventType;
  data: any;
};

export enum ServerEventType {
  FindingPlayers = 'game.findingPlayers',
  GameStarted = 'game.started',
  GameEnded = 'game.ended',
  PlayerJoined = 'game.playerJoined',
  PlayerLeft = 'game.playerLeft',
}

export enum SocketEventType {
  Connect = 'connect',
  Disconnect = 'disconnect',
  Disconnecting = 'disconnecting',
}
