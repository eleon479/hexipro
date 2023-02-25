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

// @todo load mapConfig from game session

mapConfig = testMap;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
const canvasWidth =
  2 * mapConfig.columns + mapConfig.size * 1.6 * mapConfig.columns;
const canvasHeight = mapConfig.rows * mapConfig.size * 2;
canvas.setAttribute("width", `${canvasWidth}px`);
canvas.setAttribute("height", `${canvasHeight}px`);

/* Hexipro local game instance controller */
class Game {
  constructor() {
    // turn info
    this.players = ["A", "B"];
    this.stages = ["attack", "allocate"];

    // general game state
    this.gameOver = false;
    this.gameWinner = null;

    this.currentPlayer = null;
    this.currentStage = null;

    // allocate stage state
    this.availablePower = 0;

    // attack state state
    this.currentAttackNodeSelected = false;
    this.currentAttackNodeColumn = null;
    this.currentAttackNodeRow = null;
    this.currentAttackNodePower = null;

    // button state
    this.isEndAttackButtonDisabled = false;
    this.isEndTurnButtonDisabled = true;

    this.board = null;
  }

  // var gameController = new Game();
  // gameController.config(...map1);
  // gameController.start();

  config = ({ size, columns, rows, tiles }) => {
    this.board = new Board(tiles, columns, rows, size);
    this.board.build();
  };

  start = () => {
    this.board.animate();
    this.updateCurrentPlayer("A");
    this.startAttackStage();
  };

  reset = () => {
    this.gameOver = false;
    this.gameWinner = null;
    this.currentPlayer = null;
    this.currentStage = null;
    this.availablePower = 0;
    this.currentAttackNodeSelected = false;
    this.currentAttackNodeColumn = null;
    this.currentAttackNodeRow = null;
    this.currentAttackNodePower = null;
    this.board.restoreTiles();
  };

  updateBoard = () => {
    this.board.animate();
  };

  getNextPlayer = () => {
    return this.currentPlayer === "A" ? "B" : "A";
  };

  startAllocateStage = () => {
    // clean up attack state
    this.resetAttackTile(); /* PENDING */

    // calculate new availablePower
    let tempAvailablePower = 0;

    this.board.gameTiles.forEach((col) => {
      col.forEach((tile) => {
        if (tile.player === this.currentPlayer) {
          tempAvailablePower++;
        }
      });
    });

    // this.availablePower = tempAvailablePower;
    this.updateAvailablePower(tempAvailablePower);
    // this.currentStage = 'allocate';
    this.updateCurrentStage("allocate");

    // disable End Turn button (until power is 0)
    $("#endTurn").prop("disabled", true);

    if (this.gameOver && this.gameWinner !== this.currentPlayer) {
      this.endTurn();
    }
  };

  startAttackStage = () => {
    // reset attack state
    this.updateAvailablePower(0);
    this.updateCurrentStage("attack");

    // enable End Attack button
    $("#endAttack").prop("disabled", false);

    if (this.gameOver && this.gameWinner !== this.currentPlayer) {
      this.endAttack();
    }
  };

  onTileClick = (col, row, power, player) => {
    console.log("tile click successfully dispatched to Game controller: ");
    console.log(col, row, power, player);

    if (this.currentPlayer === player) {
      console.log("same team tile click");
      this.onSameTeamTileClick(col, row, power);
    } else {
      console.log("enemy team tile click");
      this.onEnemyTeamTileClick(col, row, power);
    }

    // handle board rendering
    this.updateBoard();
  };

  onSameTeamTileClick = (col, row, power) => {
    if (this.currentStage === "allocate") {
      // allocate selection
      if (this.availablePower > 0) {
        if (this.board.gameTiles[col][row].power < 12) {
          this.board.gameTiles[col][row].power += 1;

          this.updateAvailablePower(this.availablePower - 1);
          if (this.availablePower === 0) {
            $("#endTurn").prop("disabled", false);
            // this.endTurn();
          }
        } else {
          console.log("can't allocate any more troops to this tile!");
        }
      } else {
        console.log("not enough troops?");
      }
    } else {
      // attack selection
      this.resetAttackTile();

      if (power > 1) {
        this.setAttackTile(col, row, power);
      }
    }
  };

  onEnemyTeamTileClick = (col, row, power) => {
    console.log("enemy tile click");

    if (this.currentStage === "attack" && this.currentAttackNodeSelected) {
      if (
        this.adjacentTilesCoordinates(
          this.currentAttackNodeColumn,
          this.currentAttackNodeRow,
          col,
          row
        )
      ) {
        this.attackTile(
          this.currentAttackNodeColumn,
          this.currentAttackNodeRow,
          col,
          row
        );
      }
    }
  };

  setAttackTile = (col, row, power) => {
    this.currentAttackNodeSelected = true;
    this.currentAttackNodeColumn = col;
    this.currentAttackNodeRow = row;
    this.currentAttackNodePower = power;

    this.board.gameTiles[col][row].selectAttack();
    console.log("attack node changed");
  };

  resetAttackTile = () => {
    if (
      this.currentAttackNodeSelected &&
      this.currentAttackNodeColumn != null &&
      this.currentAttackNodeRow != null
    ) {
      this.board.gameTiles[this.currentAttackNodeColumn][
        this.currentAttackNodeRow
      ].deselectAttack();
    }
    this.currentAttackNodeSelected = false;
    this.currentAttackNodeColumn = null;
    this.currentAttackNodeRow = null;
    this.currentAttackNodePower = null;
  };

  attackTile(ac, ar, bc, br) {
    let tileA = this.board.gameTiles[ac][ar];
    let tileB = this.board.gameTiles[bc][br];

    const powerDiff = Math.abs(tileA.power - tileB.power);
    let remainA = 0;
    let remainB = 0;
    let pNum = 1;
    let pDen = 1;

    let success;
    if (powerDiff >= 2) {
      if (tileA.power < tileB.power) {
        remainA = 1;
        remainB = tileB.power - tileA.power;
        success = false;
      } else {
        remainA = 1;
        remainB = tileB.power > 0 ? tileA.power - tileB.power : tileA.power - 1;
        success = true;
      }
    } else {
      remainA = 1;
      remainB = 1;

      pNum = 1;
      pDen = 1;

      if (tileA.power - tileB.power >= 1) {
        pNum = 3;
        pDen = 4;
      } else if (tileA.power - tileB.power === 0) {
        pNum = 1;
        pDen = 2;
      } else {
        pNum = 1;
        pDen = 4;
      }

      success = Math.floor(Math.random()) * pDen + 1 > pDen - pNum;
    }

    /*
          Cell Taking Algorithm

          Defender(B) has >= 2 more troops than Attacker(A):
            P(A takes B) = 0
            remain(A) = 1
            remain(B) = B - A
          
          B has >= 2 less troops than A:
            P(A takes B) = 1
            remain(A) = 1
            remain(B) = A - B
          
          diff(A, B) < 2:
            remain(A) = 1
            remain(B) = 1
            P(A takes B) = 
            {
              0.75 if A - B = 1;
              0.50 if A - B = 0;
              0.25 if A - B = -1;
            }
            if A - B = 1:
              P(A takes B) = 0.75
              remain(A) = 1
              remain(B) = 1
            if A - B = 0:
              P(A takes B) = 0.50
        */

    // update tile power
    this.board.gameTiles[ac][ar].power = remainA;
    this.board.gameTiles[bc][br].power = remainB;

    this.resetAttackTile();

    if (success) {
      // tile takeover!
      this.board.gameTiles[bc][br].player = this.currentPlayer;
      if (remainB > 1) this.setAttackTile(bc, br, remainB);

      // check to see if player b still has tiles on board
      // let enemyRemaining = 0;
      // this.board.gameTiles.forEach(col => {
      // col.forEach(tile => {
      // if (tile.player === this.getNextPlayer()) {
      // enemyRemaining += 1;
      // }
      // });
      // });

      if (!this.gameOver) {
        const isEnemyRemaining = this.board.gameTiles.some((col) => {
          return col.some((tile) => tile.player === this.getNextPlayer());
        });

        if (!isEnemyRemaining) {
          this.updateGameWinner(this.currentPlayer);
          this.endGame();
        }
      }
    }

    if (!this.isAttackAvailable()) {
      this.endAttack();
    }
  }

  isAttackAvailable = () => {
    // calculate remaining attack tiles
    let validAttackTiles = [];
    this.board.gameTiles.forEach((col) => {
      col.forEach((tile) => {
        if (tile.player === this.currentPlayer && tile.power > 1) {
          validAttackTiles.push(tile);
        }
      });
    });

    for (const tile of validAttackTiles) {
      let c = tile.c;
      let r = tile.r;
      let even = c % 2 > 0;

      // check neighboring tiles
      let neighborCoordinates = [
        { c: c - 1, r: even ? r : r - 1 }, // top left
        { c: c - 1, r: even ? r + 1 : r }, // bottom left
        { c: c, r: r - 1 }, // top
        { c: c, r: r + 1 }, // bottom
        { c: c + 1, r: even ? r : r - 1 }, // top right
        { c: c + 1, r: even ? r + 1 : r }, // bottom right
      ];

      for (const nc of neighborCoordinates) {
        let validCoordinate = nc.c >= 0 && nc.r >= 0;

        if (
          validCoordinate &&
          this.board.gameTiles[nc.c][nc.r].player !== this.currentPlayer
        ) {
          return true;
        }
      }
    }

    return false;
  };

  adjacentTilesCoordinates = (ac, ar, bc, br) => {
    const a = { c: ac, r: ar };
    const b = { c: bc, r: br };
    return this.adjacentTiles(a, b);
  };

  adjacentTiles = (a, b) => {
    let even = a.c % 2 > 0;

    // calculate tile a's neighbors
    let neighborCoordinates = [
      { c: a.c - 1, r: even ? a.r : a.r - 1 }, // top left
      { c: a.c - 1, r: even ? a.r + 1 : a.r }, // bottom left

      { c: a.c, r: a.r - 1 }, // top
      { c: a.c, r: a.r + 1 }, // bottom

      { c: a.c + 1, r: even ? a.r : a.r - 1 }, // top right
      { c: a.c + 1, r: even ? a.r + 1 : a.r }, // bottom right
    ];

    console.log(neighborCoordinates);

    for (const nc of neighborCoordinates) {
      if (nc.c >= 0 && nc.r >= 0 && nc.c === b.c && nc.r === b.r) return true;
    }

    return false;
  };

  endAttack = () => {
    // alert('attack ended');
    // this.isEndAttackButtonDisabled = true;
    $("#endAttack").prop("disabled", true);
    this.startAllocateStage();
  };

  endTurn = () => {
    // alert('turn ended');
    this.isEndTurnButtonDisabled = true;
    this.isEndAttackButtonDisabled = false;

    let nextPlayer = this.getNextPlayer();
    this.updateCurrentPlayer(nextPlayer);

    this.startAttackStage();
  };

  endGame = () => {
    // do end game logic here
    this.gameOver = true;
  };

  /* dynamic setters for the text/game info display */

  updateCurrentPlayer = (newPlayer) => {
    this.currentPlayer = newPlayer;
    $("#player").text(newPlayer);
  };

  updateCurrentStage = (newStage) => {
    this.currentStage = newStage;
    $("#stage").text(newStage);
  };

  updateAvailablePower = (newPower) => {
    this.availablePower = newPower;
    $("#power").text(newPower);
  };

  updateGameWinner = (winner) => {
    this.gameWinner = winner;
    $("#winner").text(`Player ${winner} has won!`);
  };
}

// builds, maintains, and handles updates to the grid of tiles
class Board {
  constructor(tileSetup, columns, rows, size) {
    this.gameTiles = [];
    this.tileSetup = tileSetup;
    this.columns = columns;
    this.rows = rows;
    this.size = size;
  }

  build = () => {
    this.createTiles(this.tileSetup);
    // this.animate();
  };

  restoreTiles = () => {
    this.gameTiles.forEach((col) => {
      col.forEach((tile) => {
        tile.restoreBase();
      });
    });
  };

  // turn the setup data from map.js into an array
  // of renderable / clickable HexagonTile objects
  createTiles = (tileSetup) => {
    let getCenter = (col, row) => {
      let x = this.size + col * (this.size + this.size / 2);
      let y =
        this.size +
        row * (this.size * Math.sqrt(3)) +
        (col % 2) * (this.size * (Math.sqrt(3) / 2));

      return { x, y };
    };

    for (let col = 0; col < this.columns; col++) {
      this.gameTiles.push([]);
      for (let row = 0; row < this.rows; row++) {
        let center = getCenter(col, row);
        let setup = tileSetup[col][row];

        let player = setup.player;
        let power = setup.power;
        let active = setup.active;

        let newTile = new HexagonTile(
          col,
          row,
          center.x,
          center.y,
          this.size,
          player,
          power,
          active
        );

        this.gameTiles[col].push(newTile);
      }
    }
  };

  // invoked once when game board is created,
  // and any time game state changes.
  animate = () => {
    this.gameTiles.forEach((column) => {
      column.forEach((tile) => {
        tile.draw();
      });
    });
  };
}

// handles rendering and canvas events for a game tile
class HexagonTile {
  colorOverride = null;

  constructor(c, r, cx, cy, size, player, power, active) {
    this.c = c;
    this.r = r;

    this.cx = cx;
    this.cy = cy;
    this.size = size;

    this.hexagon = null;
    this.hasEventListener = false;

    this.basePlayer = player;
    this.basePower = power;
    this.baseActive = active;

    this.player = player;
    this.power = power;
    this.active = active;
    // this.draw();

    this.attacking = false;
  }

  restoreBase = () => {
    this.player = this.basePlayer;
    this.power = this.basePower;
    this.active = this.baseActive;
    this.attacking = false;
  };

  deselectAttack = () => {
    this.attacking = false;
  };

  selectAttack = () => {
    this.attacking = true;
  };

  draw = () => {
    let size = this.size;
    let cx = this.cx;
    let cy = this.cy;
    let power = this.power;
    let player = this.player;
    let active = this.active;
    let c = this.c;
    let r = this.r;

    if (!active) {
      return;
    }

    let drawSize = size - 0.15 * size;

    this.hexagon = new Path2D();
    ctx.beginPath();
    this.hexagon.moveTo(
      cx + drawSize * Math.cos(0),
      cy + drawSize * Math.sin(0)
    );

    for (let i = 1; i <= 6; i += 1) {
      this.hexagon.lineTo(
        cx + drawSize * Math.cos((i * Math.PI) / 3),
        cy + drawSize * Math.sin((i * Math.PI) / 3)
      );
    }

    // end path
    ctx.closePath();

    // let playerLineColor = palette.green;
    let playerLineColor = palette.dark_gray;
    let playerFillColor = palette.background;

    if (player === "A") {
      playerLineColor = palette.light_teal;
      playerFillColor = palette.light_teal;
    } else if (player === "B") {
      playerLineColor = palette.red;
      playerFillColor = palette.red;
    }

    if (this.attacking) {
      playerLineColor = "white";
    }

    // canvas.addEventListener('mousemove', function (event) {
    //   if (ctx.isPointInPath(this.hexagon, event.offsetX, event.offsetY)) {
    //     console.log('point is in path of (' + c + ', ' + r + ')');
    //   }
    // });

    // player fill
    ctx.fillStyle = this.colorOverride ? this.colorOverride : playerFillColor;
    ctx.fill(this.hexagon);

    // dark gap/outline
    ctx.strokeStyle = palette.background;
    ctx.lineWidth = 15;
    ctx.stroke(this.hexagon);

    // player outline
    ctx.strokeStyle = playerLineColor;
    ctx.lineWidth = 3;
    ctx.stroke(this.hexagon);

    // power text
    let fontStyle = `${Math.floor(drawSize / 3)}px sans-serif`;
    ctx.font = fontStyle;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(`${power}`, cx, cy, drawSize);

    this.update();

    if (!this.hasEventListener) {
      canvas.addEventListener("click", this.handleCanvasClick);
      this.hasEventListener = true;
    }
  };

  handleCanvasClick = (event) => {
    if (ctx.isPointInPath(this.hexagon, event.offsetX, event.offsetY)) {
      // canvas.removeEventListener('click', this.handleCanvasClick);
      console.warn("POINT CLICKED");

      gameController.onTileClick(this.c, this.r, this.power, this.player);
    }
  };

  update = () => {};
}

var gameController = new Game();
gameController.config(mapConfig);
gameController.start();

$(document).ready(function () {
  // function disableEndAttackBtn() { $('#endAttack').prop('disabled', true); }
  // function disableEndTurnBtn() { $('#endTurn').prop('disabled', true); }
  // function enableEndAttackBtn() { $('#endAttack').prop('disabled', false); }
  // function enableEndTurnBtn() { $('#endTurn').prop('disabled', false); }
  // disableEndTurnBtn();

  // event listeners
  $("#endAttack").click(function () {
    $("#endAttack").prop("disabled", true);
    gameController.endAttack();
  });

  $("#endTurn")
    .click(function () {
      $("#endTurn").prop("disabled", true);
      gameController.endTurn();
    })
    .prop("disabled", true);

  $("#resetGame").click(function () {
    $("#winner").text("");
    gameController.reset();
    gameController.start();
  });
});