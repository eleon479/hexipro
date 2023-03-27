class Client {
  constructor() {
    this.socket = io();
    this.playerId = "";
    this.roomId = "";
    this.color = "#000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
    this.history = {
      sent: [],
      received: [],
    };
    this.statusText = "Blank";
  }

  connect() {
    this.socket.on("connect", (m) => {
      // this.history.received.push("connect", m);
      this.addServerMessage("connect (received playerId)", this.socket.id);
      this.playerId = this.socket.id;
      
      this.socket.emit("player:findGame", { color: this.color });
     
      // const send = { key: "player:findGame", value: { color: this.color } };
      // this.socket.emit(send.key, send.value);
      // this.history.sent.push(send);
      // this.statusText = "Socket connection created + Player initialized.";
    });

    this.socket.on("player.connected", (m) => {
      this.addServerMessage(`player.connected`, m);
    });

    this.socket.on("player.disconnected", (m) => {
      this.addServerMessage(`player.disconnected`, m);
    });

    this.socket.on("game.ready", (m) => {
      // this.addServerMessage(`game.ready`, JSON.stringify(m));
      let text = `- roomId: ${m.roomId} 
      - players: ${JSON.stringify(m.players)} 
      - status: ${m.status} 
      - locked: ${m.locked}
      `;
      this.addServerMessage(`game.ready`, text);
    });
  }

  addServerMessage(kind, msg) {
    var ul = document.getElementById("server-messages");
    var li = document.createElement("li");
    li.appendChild(
      document
        .createElement("pre")
        .appendChild(document.createTextNode(`${kind}: ${msg}`))
    );
    ul.appendChild(li);
  }

  addHandler(name, handlerFunction) {
    this.socket.on(name, handlerFunction);
  }
}
