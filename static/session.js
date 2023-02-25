class Session {
  constructor() {
    this.socket = io();
    this.playerId = "";
    this.roomId = "";
    this.color = "#000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
    this.status = "Not Connected";
    this.events = [];
    this.serverGameState = {};
  }

  config(startGameFn) {
    this.startGameFn = startGameFn;
    this.events.push({ type: "SessionConfigured" });
    console.log("Session.config");
  }

  connect() {
    // this.socket = io();
    this.socket.on("connect", () => {
      // get id from the connected socket and store
      this.playerId = this.socket.id;

      // register for game updates from the server
      // this.socket.on("gameUpdate", this.handleGameEvent);

      // tell server to create player with given options
      this.socket.emit("initialize", { color: this.color });

      console.log("connect - playerId: ", this.socket.id);

      this.status = "Socket connection created, Player Initialized.";
    });

    this.socket.on("WaitForEnemyConnect", (roomInfo) => {
      this.roomId = roomInfo.roomId;
      console.log("WaitForEnemyConnect - roomId: ", this.roomId);

      this.status = "Room created. Waiting for enemy to connect.";
    });

    this.socket.on("GameSessionReady", (roomInfo) => {
      this.roomId = roomInfo.roomId;
      console.log("GameSessionReady - roomId: ", this.roomId);
      console.log(roomInfo);

      this.status = "Enemy connected. Game session ready!";
      this.serverGameState = roomInfo.game;
      this.startGameFn(roomInfo);
    });

    this.events.push({ type: "SessionConnected" });
    console.log("Session.connect");
  }

  setupGame() {
    console.log("Session.setupGame");
  }

  handleGameEvent(gameEvent) {
    console.log("Session.handleGameEvent");

    if (gameEvent.type === "attack") {
      // update client to reflect the attack
    }
  }

  dispatchClientEvent(msgName, msg) {
    console.log("Session.dispatchClientEvent - msgName: ", msgName);
    console.log("msg: ", msg);
    this.socket.emit(msgName, msg);
  }

  logServerEvent(eventName, eventMessage) {
    console.log("server: ", eventName, ": ", eventMessage);
  }
}
