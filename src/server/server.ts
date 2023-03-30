import express from 'express';
import http from 'http';
import path from 'path';
import socketIO from 'socket.io';

import { PlayerService } from './services/playerService';
import { GameRoomService } from './services/gameRoomService';
import { ServerContext } from '../shared/models';
import { playerHandler } from './handlers/playerHandler';
import { gameHandler } from './handlers/gameHandler';

class App {
  private server: http.Server;
  private io: socketIO.Server;
  private port: any;
  private serverContext: ServerContext;

  constructor(port: any) {
    // create express app + serve static files from the client folder
    this.port = port;
    const app = express()
      .set('port', this.port)
      .use(express.static(path.join(__dirname, '../client')));

    // setup http server and socket.io
    this.server = new http.Server(app);
    this.io = new socketIO.Server(this.server);

    // initialize game data
    this.serverContext = {
      gameRoomService: new GameRoomService(),
      playerService: new PlayerService(),
    };

    // api to get server metadata
    app.get('/api/all', (req, res) => {
      res.send({
        players: this.serverContext.playerService.playerList,
        rooms: this.serverContext.gameRoomService.gameRoomList,
      });
    });

    app.get('/api/players', (req, res) => {
      res.send(this.serverContext.playerService.playerList);
    });

    app.get('/api/rooms', (req, res) => {
      res.send(this.serverContext.gameRoomService.gameRoomList);
    });
  }

  public start() {
    this.server.listen(this.port, () => {
      console.log(`Listening on port ${this.port}...`);
    });

    // socket.io events
    this.io.on('connection', (socket: socketIO.Socket) => {
      console.log('*'.repeat(10), `connection: ${socket.id}`, '*'.repeat(10));
      playerHandler(this.io, socket, this.serverContext);
      gameHandler(this.io, socket);
    });
  }
}

const port = process.env.PORT || 3000;
new App(port).start();
