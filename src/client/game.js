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

    // attack stage state
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

  config = ({ size, columns, rows, tiles, players }) => {
    console.log("GameController.config: players:", players);
    this.players = players.map((p) => p.playerId);
    this.board = new Board(tiles, columns, rows, size, players);
    this.board.build();
  };

  bindSession = (sessionController) => {
    this.session = sessionController;

    this.session.socket.on("gameUpdate", (msg) => {
      if (msg.type === "tileClick") {
        let data = msg.data;
        this.onTileClick(data.col, data.row, data.power, data.player, true);
      }

      if (msg.type === "endAttack") {
        let data = msg.data;
        this.endAttack(true);
      }

      if (msg.type === "endTurn") {
        let data = msg.data;
        this.endTurn(true);
      }
    });

    // ...
  };

  start = () => {
    this.board.animate();
    // this.updateCurrentPlayer(this.players[0]);
    this.updateCurrentPlayer(this.session.serverGameState.currentPlayer);
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
    // @TODO abstract this out to support > 2 players
    return this.currentPlayer === this.players[0]
      ? this.players[1]
      : this.players[0];
    // return this.currentPlayer === "A" ? "B" : "A";
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

  onTileClick = (col, row, power, player, fromServer = false) => {
    // allow this method to continue if it came from the server,
    // even if its not this player's turn
    if (this.currentPlayer !== this.session.playerId && !fromServer) {
      return;
    }

    // if its a legitimate, correct turn user action, dispatch it as well
    if (!fromServer && this.currentPlayer === this.session.playerId) {
      this.session.dispatchClientEvent("gameUpdate", {
        type: "tileClick",
        data: {
          col,
          row,
          power,
          player,
        },
      });
    }

    console.log("tile click successfully dispatched to Game controller: ");
    console.log(col, row, power, player, fromServer);

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

  endAttack = (fromServer = false) => {
    if (this.currentPlayer !== this.session.playerId && !fromServer) {
      return;
    }

    if (!fromServer && this.currentPlayer === this.session.playerId) {
      this.session.dispatchClientEvent("gameUpdate", {
        type: "endAttack",
        data: {
          currentPlayer: this.currentPlayer,
          currentStage: this.currentStage,
        },
      });
    }

    // alert('attack ended');
    // this.isEndAttackButtonDisabled = true;
    $("#endAttack").prop("disabled", true);
    this.startAllocateStage();
  };

  endTurn = (fromServer = false) => {
    if (this.currentPlayer !== this.session.playerId && !fromServer) {
      return;
    }

    if (!fromServer && this.currentPlayer === this.session.playerId) {
      this.session.dispatchClientEvent("gameUpdate", {
        type: "endTurn",
        data: {
          currentPlayer: this.currentPlayer,
          currentStage: this.currentStage,
        },
      });
    }

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
  constructor(tileSetup, columns, rows, size, players) {
    this.gameTiles = [];
    this.tileSetup = tileSetup;
    this.columns = columns;
    this.rows = rows;
    this.size = size;
    this.players = players;
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
          active,
          this.players
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

  constructor(c, r, cx, cy, size, player, power, active, players) {
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

    this.players = players;
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

    if (player) {
      let playerColor = this.players.find((p) => p.playerId === player).color;
      playerLineColor = playerColor;
      playerFillColor = playerColor;
    }

    // if (player === "A") {
    //   playerLineColor = palette.light_teal;
    //   playerFillColor = palette.light_teal;
    // } else if (player === "B") {
    //   playerLineColor = palette.red;
    //   playerFillColor = palette.red;
    // }

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
