import { GameRoomService } from '../services/gameRoomService';
import { PlayerService } from '../services/playerService';
import { ClientActionType, PlayerInfo, ServerContext, ServerEventType, Stage } from '../types/models';
import { Server, Socket } from 'socket.io';

export const playerHandler = (io: Server, socket: Socket, context: ServerContext) => {
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
    socket.rooms.forEach((room) => io.to(room).emit('player:disconnect', socket.id));
  };

  const clickTile = (event: { col: number; row: number; player: string; room: string }) => {
    console.log(ClientActionType.ClickTile, event);

    const room = context.gameRoomService.getGameRoom(event.room);
    if (!room) {
      console.warn('Room not found:', event.room);
      return;
    }

    const gameState = room.gameState;
    const map = gameState.map;
    const clickedTile = map.tiles[event.col]?.[event.row];

    if (!clickedTile) {
      console.warn('Invalid tile coordinates:', event.col, event.row);
      return;
    }

    // Check if it's this player's turn
    if (gameState.currentPlayer?.id !== event.player) {
      console.log('Not your turn!');
      return;
    }

    if (gameState.stage === Stage.Attack) {
      handleAttackStageClick(event, room);
    } else if (gameState.stage === Stage.Allocate) {
      handleAllocateStageClick(event, room);
    }
  };

  const handleAttackStageClick = (event: { col: number; row: number; player: string; room: string }, room: any) => {
    const gameState = room.gameState;
    const map = gameState.map;
    const clickedTile = map.tiles[event.col][event.row];

    // If no attack node selected yet
    if (!gameState.currentAttackNodeSelected) {
      // Player must click their own tile to select as attack source
      if (clickedTile.player?.id === event.player && clickedTile.power > 1) {
        gameState.currentAttackNodeSelected = true;
        gameState.currentAttackNodeColumn = event.col;
        gameState.currentAttackNodeRow = event.row;
        gameState.currentAttackNodePower = clickedTile.power;
        console.log(`Selected attack source: (${event.col}, ${event.row}) with power ${clickedTile.power}`);
      } else if (clickedTile.player?.id === event.player) {
        console.log('Need power > 1 to attack from this tile');
      }
    } else {
      // Attack node is selected, this click is the target
      const sourceCol = gameState.currentAttackNodeColumn;
      const sourceRow = gameState.currentAttackNodeRow;

      // Check if clicking the same tile (deselect)
      if (event.col === sourceCol && event.row === sourceRow) {
        gameState.currentAttackNodeSelected = false;
        gameState.currentAttackNodeColumn = -1;
        gameState.currentAttackNodeRow = -1;
        gameState.currentAttackNodePower = 0;
        console.log('Deselected attack source');
      }
      // Check if target is adjacent
      else if (isAdjacent(sourceCol, sourceRow, event.col, event.row)) {
        const sourceTile = map.tiles[sourceCol][sourceRow];

        // Can't attack your own tile
        if (clickedTile.player?.id === event.player) {
          console.log('Cannot attack your own tile');
        }
        // Attack!
        else if (sourceTile.power > clickedTile.power) {
          // Successful attack - transfer tile ownership
          console.log(`Attack successful! (${sourceCol},${sourceRow}) -> (${event.col},${event.row})`);

          // Transfer power (minus 1 for the attack cost)
          clickedTile.power = sourceTile.power - 1;
          clickedTile.player = sourceTile.player;
          clickedTile.color = sourceTile.color;

          // Source tile loses all but 1 power
          sourceTile.power = 1;

          // Reset attack selection
          gameState.currentAttackNodeSelected = false;
          gameState.currentAttackNodeColumn = -1;
          gameState.currentAttackNodeRow = -1;
          gameState.currentAttackNodePower = 0;

          // Check win condition
          checkWinCondition(room, io, event.room);
        } else {
          console.log(`Attack failed - need more power! (${sourceTile.power} vs ${clickedTile.power})`);
        }
      } else {
        console.log('Target tile is not adjacent');
      }
    }

    // Broadcast updated state
    io.to(event.room).emit(ServerEventType.BoardChanged, room);
  };

  const handleAllocateStageClick = (event: { col: number; row: number; player: string; room: string }, room: any) => {
    const gameState = room.gameState;
    const map = gameState.map;
    const clickedTile = map.tiles[event.col][event.row];
    const player = room.players[event.player];

    // Can only allocate power to your own tiles
    if (clickedTile.player?.id !== event.player) {
      console.log('Can only allocate to your own tiles');
      return;
    }

    // Check if player has available power
    if (player.gameState.availablePower > 0) {
      clickedTile.power += 1;
      player.gameState.availablePower -= 1;
      console.log(`Allocated power to (${event.col}, ${event.row}). Remaining: ${player.gameState.availablePower}`);
    } else {
      console.log('No available power to allocate');
    }

    // Broadcast updated state
    io.to(event.room).emit(ServerEventType.BoardChanged, room);
  };

  const isAdjacent = (col1: number, row1: number, col2: number, row2: number): boolean => {
    // Hex grid adjacency for "pointy-top" hexagons with offset coordinates
    const isEvenCol = col1 % 2 === 0;

    const adjacentOffsets = isEvenCol
      ? [
          [-1, -1],
          [-1, 0],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
        ] // even column
      : [
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, 0],
          [1, 1],
        ]; // odd column

    for (const [dc, dr] of adjacentOffsets) {
      if (col1 + dc === col2 && row1 + dr === row2) {
        return true;
      }
    }
    return false;
  };

  const checkWinCondition = (room: any, io: Server, roomId: string) => {
    const map = room.gameState.map;
    const playerTileCounts: { [playerId: string]: number } = {};

    // Count tiles per player
    for (let col = 0; col < map.columns; col++) {
      for (let row = 0; row < map.rows; row++) {
        const tile = map.tiles[col][row];
        if (tile.player && tile.active) {
          playerTileCounts[tile.player.id] = (playerTileCounts[tile.player.id] || 0) + 1;
        }
      }
    }

    // Check if any player has 0 tiles (they lost)
    const playerIds = Object.keys(room.players);
    for (const playerId of playerIds) {
      if (!playerTileCounts[playerId] || playerTileCounts[playerId] === 0) {
        const winnerId = playerIds.find((id) => id !== playerId);
        console.log(`Game Over! Winner: ${winnerId}`);
        room.gameState.gameOver = true;
        room.gameState.winner = room.players[winnerId!];
        io.to(roomId).emit(ServerEventType.GameEnded, { winner: room.players[winnerId!] });
        return true;
      }
    }
    return false;
  };

  const endAttack = (event: { player: string; room: string }) => {
    console.log(ClientActionType.EndAttack, event);

    const room = context.gameRoomService.getGameRoom(event.room);
    if (!room) return;

    // Check if it's this player's turn
    if (room.gameState.currentPlayer?.id !== event.player) {
      console.log('Not your turn!');
      return;
    }

    // Switch to Allocate stage
    room.gameState.stage = Stage.Allocate;
    room.gameState.currentAttackNodeSelected = false;
    room.gameState.currentAttackNodeColumn = -1;
    room.gameState.currentAttackNodeRow = -1;
    room.gameState.currentAttackNodePower = 0;

    // Calculate available power (number of tiles owned)
    const map = room.gameState.map;
    let tileCount = 0;
    for (let col = 0; col < map.columns; col++) {
      for (let row = 0; row < map.rows; row++) {
        if (map.tiles[col][row].player?.id === event.player && map.tiles[col][row].active) {
          tileCount++;
        }
      }
    }
    room.players[event.player].gameState.availablePower = tileCount;
    console.log(`Player ${event.player} has ${tileCount} power to allocate`);

    io.to(event.room).emit(ServerEventType.BoardChanged, room);
  };

  const endTurn = (event: { player: string; room: string }) => {
    console.log(ClientActionType.EndTurn, event);

    const room = context.gameRoomService.getGameRoom(event.room);
    if (!room) return;

    // Check if it's this player's turn
    if (room.gameState.currentPlayer?.id !== event.player) {
      console.log('Not your turn!');
      return;
    }

    // Switch to next player
    const playerIds = Object.keys(room.players);
    const nextPlayerId = playerIds.find((id) => id !== event.player);

    if (nextPlayerId) {
      room.gameState.currentPlayer = room.players[nextPlayerId];
      room.gameState.stage = Stage.Attack;
      room.gameState.currentAttackNodeSelected = false;
      room.players[event.player].gameState.availablePower = 0;
      console.log(`Turn passed to ${nextPlayerId}`);
    }

    io.to(event.room).emit(ServerEventType.BoardChanged, room);
  };

  socket.on(ClientActionType.FindGame, findGame);
  socket.on(ClientActionType.ClickTile, clickTile);
  socket.on(ClientActionType.EndAttack, endAttack);
  socket.on(ClientActionType.EndTurn, endTurn);
  socket.on('disconnect', disconnectPlayer);
  socket.on('disconnecting', disconnectPlayerFromRooms);
};
