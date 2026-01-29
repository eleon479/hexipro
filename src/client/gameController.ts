import { ClientAction, ClientActionType, GameMap, Game, Player, Stage } from '../shared/models';
import { palette } from '../shared/palette';

export class GameController {
  private gameState: Game;
  private socket: SocketIOClient.Socket | null = null;
  private playerId: string = '';
  private roomId: string = '';
  private player: Player | null = null;

  private isEndAttackButtonDisabled: boolean;
  private isEndTurnButtonDisabled: boolean;

  private board: Board | null = null;
  private selectedTile: { col: number; row: number } | null = null;

  constructor() {
    this.gameState = {} as Game;
    this.isEndAttackButtonDisabled = true;
    this.isEndTurnButtonDisabled = true;
  }

  public setGameState(gameState: Game) {
    this.gameState = gameState;
  }

  public setSocket(socket: SocketIOClient.Socket) {
    this.socket = socket;
  }

  public setPlayerInfo(playerId: string, roomId: string, player: Player) {
    this.playerId = playerId;
    this.roomId = roomId;
    this.player = player;
  }

  public create() {
    this.board = new Board(this.gameState.map);
    this.board.setOnTileClick((col, row) => this.onTileClicked(col, row));
    this.board.buildCanvas();
    this.updateUI();
    this.board.render();

    // Wire up button handlers
    const endAttackBtn = document.getElementById('endAttack');
    const endTurnBtn = document.getElementById('endTurn');
    const resetBtn = document.getElementById('resetGame');

    if (endAttackBtn) {
      endAttackBtn.addEventListener('click', () => this.handleEndAttack());
    }
    if (endTurnBtn) {
      endTurnBtn.addEventListener('click', () => this.handleEndTurn());
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => window.location.reload());
    }
  }

  public updateFromServer() {
    // Rebuild board with new map data
    if (this.board) {
      this.board.updateTiles(this.gameState.map);
      this.board.render();
    }
    this.updateUI();
    this.selectedTile = null;
  }

  private updateUI() {
    // Update player info display
    const playerSpan = document.getElementById('player');
    const stageSpan = document.getElementById('stage');
    const powerSpan = document.getElementById('power');

    if (playerSpan) {
      const isMyTurn = this.gameState.currentPlayer?.id === this.playerId;
      playerSpan.textContent = isMyTurn ? 'Your turn!' : 'Waiting...';
      playerSpan.style.color = isMyTurn ? '#26c99e' : '#ff6b6b';
    }
    if (stageSpan) {
      stageSpan.textContent = this.gameState.stage || 'N/A';
    }
    if (powerSpan && this.player) {
      powerSpan.textContent = String(this.player.gameState?.availablePower || 0);
    }

    // Update button states
    const endAttackBtn = document.getElementById('endAttack') as HTMLButtonElement;
    const endTurnBtn = document.getElementById('endTurn') as HTMLButtonElement;

    const isMyTurn = this.gameState.currentPlayer?.id === this.playerId;

    if (endAttackBtn) {
      endAttackBtn.disabled = !isMyTurn || this.gameState.stage !== Stage.Attack;
    }
    if (endTurnBtn) {
      endTurnBtn.disabled = !isMyTurn || this.gameState.stage !== Stage.Allocate;
    }
  }

  public showWinner(winner: Player, myPlayerId: string) {
    const winnerDiv = document.getElementById('winner');
    if (winnerDiv) {
      const didIWin = winner.id === myPlayerId;
      winnerDiv.textContent = didIWin ? '🎉 YOU WIN! 🎉' : '😢 You Lost';
      winnerDiv.style.color = didIWin ? '#26c99e' : '#ff6b6b';
      winnerDiv.style.fontSize = '2rem';
    }
  }

  private onTileClicked(col: number, row: number) {
    if (!this.socket || !this.board) return;

    // Check if it's my turn
    if (this.gameState.currentPlayer?.id !== this.playerId) {
      console.log('Not your turn!');
      return;
    }

    // Send click to server - let server handle the logic
    this.socket.emit(ClientActionType.ClickTile, {
      col,
      row,
      player: this.playerId,
      room: this.roomId,
    });
  }

  private handleEndAttack() {
    if (!this.socket) return;

    if (this.gameState.currentPlayer?.id !== this.playerId) {
      console.log('Not your turn!');
      return;
    }

    this.socket.emit(ClientActionType.EndAttack, {
      player: this.playerId,
      room: this.roomId,
    });
  }

  private handleEndTurn() {
    if (!this.socket) return;

    if (this.gameState.currentPlayer?.id !== this.playerId) {
      console.log('Not your turn!');
      return;
    }

    this.socket.emit(ClientActionType.EndTurn, {
      player: this.playerId,
      room: this.roomId,
    });
  }

  public handleAction(action: ClientAction) {
    switch (action.type) {
      case ClientActionType.ClickTile:
        this.onTileClicked(action.data.col, action.data.row);
        break;
      case ClientActionType.EndTurn:
        this.handleEndTurn();
        break;
      case ClientActionType.EndAttack:
        this.handleEndAttack();
        break;
      default:
        console.error('Invalid action type', action);
    }
  }
}

class Board {
  private canvasTiles: CanvasTile[][];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onTileClick: ((col: number, row: number) => void) | null = null;

  constructor(private tileSetup: GameMap) {
    this.canvasTiles = [];
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  public setOnTileClick(callback: (col: number, row: number) => void) {
    this.onTileClick = callback;
  }

  public buildCanvas() {
    const getCenter = (col: number, row: number) => {
      let x = this.tileSetup.size + col * (this.tileSetup.size + this.tileSetup.size / 2);

      let y =
        this.tileSetup.size +
        row * (this.tileSetup.size * Math.sqrt(3)) +
        (col % 2) * (this.tileSetup.size * (Math.sqrt(3) / 2));

      return { x, y };
    };

    // Calculate canvas size based on map dimensions
    const canvasWidth =
      this.tileSetup.size * 2 + (this.tileSetup.columns - 1) * (this.tileSetup.size * 1.5) + this.tileSetup.size;
    const canvasHeight =
      this.tileSetup.size * 2 + this.tileSetup.rows * (this.tileSetup.size * Math.sqrt(3)) + this.tileSetup.size;

    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    for (let col = 0; col < this.tileSetup.columns; col++) {
      this.canvasTiles.push([]);
      for (let row = 0; row < this.tileSetup.rows; row++) {
        const { x, y } = getCenter(col, row);
        const newTile = new CanvasTile(
          col,
          row,
          x,
          y,
          this.tileSetup.size,
          this.tileSetup.tiles[col][row].color,
          this.tileSetup.tiles[col][row].power,
          this.tileSetup.tiles[col][row].active,
          this.tileSetup.tiles[col][row].player,
        );

        this.canvasTiles[col].push(newTile);
      }
    }

    // Add single click handler for the canvas
    this.canvas.addEventListener('click', (event: MouseEvent) => {
      this.handleCanvasClick(event.offsetX, event.offsetY);
    });
  }

  private handleCanvasClick(clickX: number, clickY: number) {
    // Find which tile was clicked by checking distance to each tile center
    for (let col = 0; col < this.canvasTiles.length; col++) {
      for (let row = 0; row < this.canvasTiles[col].length; row++) {
        const tile = this.canvasTiles[col][row];
        if (tile.isPointInside(clickX, clickY, this.ctx)) {
          console.log(`Clicked tile at col: ${col}, row: ${row}`);
          if (this.onTileClick) {
            this.onTileClick(col, row);
          }
          return;
        }
      }
    }
  }

  public getTile(col: number, row: number): CanvasTile | null {
    if (this.canvasTiles[col] && this.canvasTiles[col][row]) {
      return this.canvasTiles[col][row];
    }
    return null;
  }

  public updateTiles(newMap: GameMap) {
    // Update existing tiles with new data from server
    for (let col = 0; col < newMap.columns; col++) {
      for (let row = 0; row < newMap.rows; row++) {
        const tile = this.canvasTiles[col]?.[row];
        if (tile) {
          tile.updateFromServer(
            newMap.tiles[col][row].color,
            newMap.tiles[col][row].power,
            newMap.tiles[col][row].active,
            newMap.tiles[col][row].player,
          );
        }
      }
    }
  }

  public render() {
    // Clear canvas before re-rendering
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvasTiles.forEach((column) => {
      column.forEach((tile) => {
        tile.draw(this.canvas, this.ctx);
      });
    });
  }
}

class CanvasTile {
  private hexagon: Path2D;
  private drawSize: number;
  private _attacking: boolean;

  constructor(
    private col: number,
    private row: number,
    private x: number,
    private y: number,
    private size: number,
    private color: string,
    private power: number,
    private active: boolean,
    private player: Player | null,
  ) {
    this.drawSize = this.size - 0.15 * this.size;
    this.hexagon = new Path2D();
    this._attacking = false;
  }

  public get attacking(): boolean {
    return this._attacking;
  }

  public set attacking(value: boolean) {
    this._attacking = value;
  }

  public isPointInside(px: number, py: number, ctx: CanvasRenderingContext2D): boolean {
    return ctx.isPointInPath(this.hexagon, px, py);
  }

  public updateFromServer(color: string, power: number, active: boolean, player: Player | null) {
    this.color = color;
    this.power = power;
    this.active = active;
    this.player = player;
    this._attacking = false; // Reset attacking state on update
  }

  public draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    this.hexagon = new Path2D();
    ctx.beginPath();

    this.hexagon.moveTo(this.x + this.drawSize * Math.cos(0), this.y + this.drawSize * Math.sin(0));

    for (let i = 1; i <= 6; i += 1) {
      this.hexagon.lineTo(
        this.x + this.drawSize * Math.cos((i * Math.PI) / 3),
        this.y + this.drawSize * Math.sin((i * Math.PI) / 3),
      );
    }

    ctx.closePath();

    let playerLineColor = palette.dark_gray;
    let playerFillColor = palette.background;

    if (this.player !== null) {
      playerLineColor = this.color;
      playerFillColor = this.color;
    }

    if (this._attacking) {
      playerLineColor = palette.white;
    }

    // player fill
    ctx.fillStyle = playerFillColor;
    ctx.fill(this.hexagon);

    // gap / outline
    ctx.strokeStyle = palette.background;
    ctx.lineWidth = 15;
    ctx.stroke(this.hexagon);

    // player outline
    ctx.strokeStyle = playerLineColor;
    ctx.lineWidth = 3;
    ctx.stroke(this.hexagon);

    // power text
    let fontStyle = `${Math.floor(this.drawSize / 3)}px sans-serif`;
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(`${this.power}`, this.x, this.y, this.drawSize);
  }
}
