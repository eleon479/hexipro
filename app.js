/*
Incoming server events will invoke Game Controller methods
(if its your turn): Game (actions) will dispatch client events

client A
  \
  [Server] <===> [db]  
  /
client B

A Server "Game" session/room is "locked" once 2 clients are connected, setup + ready.

ServerEvent: {} (sent by server, received by clients*)
ClientEvent: {} (sent by client, received by server)

ClientEvents:
- CreateGame             - SelectTile
- Connect                - DeselectTile
- Setup                  - AttackTile (can trigger end attack / start allocate)
- Ready                  - AllocateTile (can trigger end turn)

ServerEvents: 
- WaitForEnemyConnect    - StartTurn      - StartAllocate    - ChangeActivePlayer
- WaitForEnemySetup      - StartAttack    - AllocateTile     - EndGame
- EnemyReady             - AttackTile     - EndAllocate
- StartGame              - EndAttack      - EndTurn
- DisconnectPlayer

When client A connects, server will provide it with base map but
not start game yet, waiting for other client. (state: 'waitingConnect'?)

When client B connects, server will provide B with base map, and both
with (state: 'waitingInit') while B gets things set up.

When client B finishes setup, server provides both A & B with
(serverEvent: {type: 'gameStart', currentPlayer: 'A', stage: 'attack'})

Client A clicks a valid tile -> {type: 'tileSelect', tile: {col: 0, row: 0} }

Client A attacks a valid tile -> {
  type: 'tileAttack',
  player: 'A',
  srcTileResult: {
    col: 0, row: 0, owner: 'A', power: 1
  },
  dstTileResult: {
    col: 1, row: 0, owner: 'A', power: 1
  },
}

Client A ends attack/start allocate stage -> {
  type: 'endAttack',
  player: 'A',
  stage: 'allocate'
}

Client A allocates power to a tile -> {
  type: 'allocatePower',
  player: 'A',
  tileResult: {
    col: 1, row: 0, owner: 'A', power 2
  },
  powerResult: 1
}
...
Client A ends turn -> {
  type: 'endTurn',
  player: 'A',
  currentPlayer: 'B',
  stage: 'attack'
}
...

Each incoming ServerEvent will invoke a GameController function that subsequently
updates the local game state, board, tiles, etc...

Each local game action will dispatch a ClientEvent. (Before receiving success status from 
  server, we can update client state since preliminary checks are done + we don't want to 
  have the game seem unresponsive. We will simply mark the event/state as 'unverified')
  - If ClientEvent successful: Server sends ServerEvent to both clients. 
    - Client A (that sent the event) will simply update its state to 'verified'
    - Client B will update its state as necessary in response to event.
  - If not successful: Server sends ServerEvent targetClient: 'A' and (revert)
    - Client A must update its state back to previous state before action
    - Client B is unchanged


Note: Players can "End Attack" before they've exhausted all possible options.
  but Players cannot "End Turn" before allocating all power points.

Suggestion: End Turn as soon as all power points are allocated (to keep other player from waiting)

*/
