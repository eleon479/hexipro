import { GameController } from './gameController';
import { of, fromEvent, Observable } from 'rxjs';
import {
  Player,
  GameRoom,
  Game,
  ClientActionType,
  ServerEventType,
  SocketEventType,
} from '../shared/models';
import { on } from 'events';
import { type } from 'os';
import { connect } from 'socket.io-client';

export class Client {
  private socket: SocketIOClient.Socket;

  private history: {
    sent: any[];
    received: any[];
  };

  private player: Player;
  private gameRoom: GameRoom;
  private game: Game;

  // private events$: Observable<ServerEvent>;
  // private actions$: Observable<ClientAction>;

  constructor() {
    this.socket = io();
    this.history = {
      sent: [],
      received: [],
    };
    this.player = {} as Player;
    this.gameRoom = {} as GameRoom;
    this.game = {} as Game;
  }

  public connect() {
    this.socket.on(SocketEventType.Connect, () => {
      this.showServerMessage(SocketEventType.Connect, this.socket.id);
      this.socket.emit(ClientActionType.FindGame, {
        color: this.getRandomColor(),
      });
    });

    this.socket.on(ServerEventType.FindingPlayers, (data: GameRoom) => {
      this.showServerMessage(ServerEventType.FindingPlayers, data);
    });

    this.socket.on(ServerEventType.GameStarted, (data: GameRoom) => {
      const text = `- roomId: ${data.id}
      - players: ${JSON.stringify(data.players)}
      - status: ${data.status}
      - locked: ${data.locked}
      `;

      this.showServerMessage(ServerEventType.GameStarted, text);
      this.sync(data);

      // start game
    });

    this.socket.on(ServerEventType.PlayerJoined, (data: any) => {
      this.showServerMessage(ServerEventType.PlayerJoined, data);
    });

    this.socket.on(ServerEventType.PlayerLeft, (data: any) => {
      this.showServerMessage(ServerEventType.PlayerLeft, data);
    });

    this.socket.on(SocketEventType.Disconnect, (data: any) => {
      this.showServerMessage(SocketEventType.Disconnect, data);
    });
  }

  sync(serverState: GameRoom) {
    this.gameRoom = { ...serverState };
    this.game = { ...serverState.gameState };
    this.player = { ...serverState.players[this.player.id] };
  }

  // on(action: ClientAction, handlerFunction: Function) {
  //   this.socket.on(action.type, handlerFunction);
  // }

  public handleGameAction() {}
  public handleGameEvent() {}
  private getRandomColor() {
    return '#000000'.replace(/0/g, () => {
      return (~~(Math.random() * 16)).toString(16);
    });
  }
  private showServerMessage(type: string, message: any) {
    var ul = document.getElementById('server-messages');
    var li = document.createElement('li');
    li.appendChild(
      document
        .createElement('pre')
        .appendChild(document.createTextNode(`${type}: ${message}`))
    );
  }
}

const client = new Client();
const gameController = new GameController();

//client.connect();
// game.bind(client).start();

// const socket$ = of(io());
// const connect$ = socket$.pipe();
