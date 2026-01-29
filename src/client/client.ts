import { Player, GameRoom, Game, ClientActionType, ServerEventType, SocketEventType } from '../shared/models';
import { GameController } from './gameController';

class Client {
  private socket: SocketIOClient.Socket;
  private gameController: GameController | null = null;

  private history: {
    sent: any[];
    received: any[];
  };

  private player: Player;
  private playerId: string;
  private gameRoom: GameRoom;
  private game: Game;

  constructor() {
    this.socket = io();
    this.history = {
      sent: [],
      received: [],
    };
    this.player = {} as Player;
    this.playerId = '';
    this.gameRoom = {} as GameRoom;
    this.game = {} as Game;
  }

  public connect() {
    this.socket.on(SocketEventType.Connect, () => {
      this.playerId = this.socket.id;
      this.showServerMessage(SocketEventType.Connect, this.socket.id);
      this.socket.emit(ClientActionType.FindGame, {
        color: this.getRandomColor(),
      });
    });

    this.socket.on(ServerEventType.FindingPlayers, (data: GameRoom) => {
      this.showServerMessage(ServerEventType.FindingPlayers, 'Waiting for another player...');
      this.gameRoom = data;
    });

    this.socket.on(ServerEventType.GameStarted, (data: GameRoom) => {
      this.showServerMessage(ServerEventType.GameStarted, `Game started in room ${data.id}`);
      this.sync(data);

      // Create game controller and pass socket for emitting events
      this.gameController = new GameController();
      this.gameController.setGameState(data.gameState);
      this.gameController.setPlayerInfo(this.playerId, data.id, data.players[this.playerId]);
      this.gameController.setSocket(this.socket);
      this.gameController.create();
    });

    this.socket.on(ServerEventType.BoardChanged, (data: GameRoom) => {
      console.log('BoardChanged received:', data);
      this.sync(data);

      if (this.gameController) {
        this.gameController.setGameState(data.gameState);
        this.gameController.setPlayerInfo(this.playerId, data.id, data.players[this.playerId]);
        this.gameController.updateFromServer();
      }
    });

    this.socket.on(ServerEventType.GameEnded, (data: { winner: Player }) => {
      this.showServerMessage(ServerEventType.GameEnded, `Game Over! Winner: ${data.winner.id}`);
      if (this.gameController) {
        this.gameController.showWinner(data.winner, this.playerId);
      }
    });

    this.socket.on(ServerEventType.PlayerJoined, (data: any) => {
      this.showServerMessage(ServerEventType.PlayerJoined, 'Another player joined!');
    });

    this.socket.on(ServerEventType.PlayerLeft, (data: any) => {
      this.showServerMessage(ServerEventType.PlayerLeft, 'A player left the game');
    });

    this.socket.on(SocketEventType.Disconnect, (data: any) => {
      this.showServerMessage(SocketEventType.Disconnect, 'Disconnected from server');
    });
  }

  sync(serverState: GameRoom) {
    this.gameRoom = { ...serverState };
    this.game = { ...serverState.gameState };
    if (serverState.players[this.playerId]) {
      this.player = { ...serverState.players[this.playerId] };
    }
  }

  private getRandomColor() {
    // Generate a nicer random color from a preset palette
    const colors = ['#26c99e', '#66bfff', '#cc78fa', '#f553bf', '#ff6b6b', '#ffd93d'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private showServerMessage(type: string, message: any) {
    const ul = document.getElementById('server-messages');
    if (ul) {
      const li = document.createElement('li');
      li.textContent = `${type}: ${message}`;
      ul.appendChild(li);
      // Keep only last 5 messages
      while (ul.children.length > 5) {
        ul.removeChild(ul.firstChild!);
      }
    }
    console.log(`[${type}]`, message);
  }
}

const client = new Client();
client.connect();
