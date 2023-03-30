import {
  ClientAction,
  ClientActionType,
  GameMap,
  Game,
  Player,
  Stage,
} from '../shared/models';
import { palette } from '../shared/palette';
import { Client } from './client';

export class GameController {
  private gameState: Game;

  private isEndAttackButtonDisabled: boolean;
  private isEndTurnButtonDisabled: boolean;

  private board: Board;
  private client: Client;

  constructor() {
    this.gameState = {} as Game;
    this.board = {} as Board;
    this.client = {} as Client;
    this.isEndAttackButtonDisabled = true;
    this.isEndTurnButtonDisabled = true;
  }

  /* 
    @REVIEW: 
    Should the game contain the client, 
    or should the client contain the game?
    Alternatively, should they both be one?

    I think the client should contain the game,
    and the game should contain the client.
    The game should be able to send actions to the client,
    and the client should be able to send actions to the game.

    -----prev-----
        I think the game should contain the client,
    because the game is the one that needs to
    send actions to the client.

    The client should not need to know about the game.
    
    The client should only need to know about the server.
  */

  public bind(client: Client): GameController {
    this.client = client;

    // this.client.on(action, (data: any) => {
    //   console.log(data);
    // });

    return this;
  }

  public start() {}

  public create() {
    this.board = new Board(this.gameState.map);
    this.board.buildCanvas();
    this.update();
  }

  public update() {
    this.board.render();
  }

  public handleEvent() {
    // this.client.on('game.update', (gameState: GameState) => {
    //   this.gameState = gameState;
    //   this.update();
    // });
  }

  public handleAction(action: ClientAction) {
    switch (action.type) {
      case ClientActionType.ClickTile:
        this.handleClick(action.data);
        break;
      case ClientActionType.EndTurn:
        this.handleEndTurn(action.data);
        break;
      case ClientActionType.EndAttack:
        this.handleEndAttack(action.data);
        break;
      default:
        console.error('Invalid action type', action);
    }
  }

  private handleClick(data: any) {}

  private handleEndTurn(data: any) {}

  private handleEndAttack(data: any) {}
}

class Board {
  private canvasTiles: CanvasTile[][];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  constructor(private tileSetup: GameMap) {
    this.canvasTiles = [];
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  public buildCanvas() {
    const getCenter = (col: number, row: number) => {
      let x =
        this.tileSetup.size +
        col * (this.tileSetup.size + this.tileSetup.size / 2);

      let y =
        this.tileSetup.size +
        row * (this.tileSetup.size * Math.sqrt(3)) +
        (col % 2) * (this.tileSetup.size * (Math.sqrt(3) / 2));

      return { x, y };
    };

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
          this.tileSetup.tiles[col][row].player
        );

        this.canvasTiles[col].push(newTile);
      }
    }
  }

  public render() {
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
  private hasEventListener: boolean;
  private attacking: boolean;

  constructor(
    private col: number,
    private row: number,
    private x: number,
    private y: number,
    private size: number,
    private color: string,
    private power: number,
    private active: boolean,
    private player: Player | null
  ) {
    this.drawSize = this.size - 0.15 * this.size;
    this.hexagon = new Path2D();
    this.hasEventListener = false;
    this.attacking = false;
  }

  public draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    this.hexagon = new Path2D();
    ctx.beginPath();

    this.hexagon.moveTo(
      this.x + this.drawSize * Math.cos(0),
      this.y + this.drawSize * Math.sin(0)
    );

    for (let i = 1; i <= 6; i += 1) {
      this.hexagon.lineTo(
        this.x + this.drawSize * Math.cos((i * Math.PI) / 3),
        this.y + this.drawSize * Math.sin((i * Math.PI) / 3)
      );
    }

    ctx.closePath();

    let playerLineColor = palette.dark_gray;
    let playerFillColor = palette.background;

    if (this.player !== null) {
      // let playerColor = this.player.color;
      // playerLineColor = this.player.color;
      // playerFillColor = this.player.color;
      playerLineColor = this.color;
      playerFillColor = this.color;
    }

    if (this.attacking) {
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

    if (!this.hasEventListener) {
      canvas.addEventListener('click', this.handleCanvasClick);
      this.hasEventListener = true;
    }
  }

  public handleCanvasClick = (event: any) => {
    // if (this.ctx.isPointInPath(this.hexagon, event.offsetX, event.offsetY)) {
    //   console.warn('clicked', this.col, this.row);

    //   emit()
    // }

    console.warn('clicked', event.offsetX, event.offsetY);
  };
}
