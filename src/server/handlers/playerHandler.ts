import { GameRoomService } from '../services/gameRoomService';
import { PlayerService } from '../services/playerService';
import {
  ClientActionType,
  PlayerInfo,
  ServerContext,
  ServerEventType,
} from '../../shared/models';
import { Server, Socket } from 'socket.io';

export const playerHandler = (
  io: Server,
  socket: Socket,
  context: ServerContext
) => {
  const findGame = (playerInfo: PlayerInfo) => {
    let player = context.playerService.insert(socket.id, playerInfo);
    let { room, isNew } = context.gameRoomService.findOpenRoom();

    player = context.playerService.assignRoom(player.id, room);
    room = context.gameRoomService.addPlayer(room.id, player);

    // let the current connection know to listen into assigned room
    socket.join(room.id);

    // tell everyone in the room this player joined
    socket.to(room.id).emit(ServerEventType.PlayerJoined, player);

    // @todo move to gameHandler
    if (room.isReady) {
      room = context.gameRoomService.createMap(room.id);
      io.to(room.id).emit(ServerEventType.GameStarted, room);
    } else {
      io.to(room.id).emit(ServerEventType.FindingPlayers, room);
    }
  };

  const disconnectPlayer = () => {
    let playerId = context.playerService.getPlayerBySocketId(socket.id);

    if (playerId) {
      context.gameRoomService.removePlayerFromRooms(socket.id);
      context.gameRoomService.removeEmptyRooms();
      context.playerService.removePlayer(socket.id);
    } else {
      console.warn("can't remove nonexistent player≠", socket.id);
    }
  };

  const disconnectPlayerFromRooms = () => {
    let playerId = context.playerService.getPlayerBySocketId(socket.id);

    socket.rooms.forEach((room) =>
      io.to(room).emit('player:disconnect', socket.id)
    );
  };

  const clickTile = (event) => {
    // click tile logic
    // take in the event and perform necessary
    // changes to the state
    // delegate to a new MapService if necessary
    console.log(ClientActionType.ClickTile, event);
  };

  const endAttack = (event) => {
    // have some logic check incoming event against internal server
    // state. if time allows
    // realistically tho:
    // if all is good, just make sure to update the
    // server state and have those changes propagate?
    console.log(ClientActionType.EndAttack, event);
  };

  const endTurn = (event) => {
    console.log(ClientActionType.EndTurn, event);
  };

  /*
  @todo: 
  
  - break down initialize
  - handlers:
  
  1) :init - insert client into player pool (map socket.id <=> player.id)
    @emit playerId
    !save in localstorage for next connect
  2) :seek - look for open rooms or create a new room + add client to room
    @join roomId
    @broadcast(roomId, playerIds?)
  3) :rejoin - try to reconnect client (w/ playerId) to their last room
    @join roomId
    @broadcast(roomId, playerIds?)

    further: (differentiate on client based on if they have a localStorage
      "playerId" item, no real auth for now)

    player:
      new:
        init => playerId
      existing:
        findGame {playerId} => roomId
        createGame {playerId} => roomId
        rejoinGame {playerId, lastRoomId} => roomId
  */

  socket.on(ClientActionType.FindGame, findGame);
  socket.on(ClientActionType.ClickTile, clickTile);
  socket.on(ClientActionType.EndAttack, endAttack);
  socket.on(ClientActionType.EndTurn, endTurn);
  socket.on('disconnect', disconnectPlayer);
  socket.on('disconnecting', disconnectPlayerFromRooms);
};
