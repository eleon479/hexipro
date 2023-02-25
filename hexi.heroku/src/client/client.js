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
      this.history.received.push("connect", m);
      this.playerId = this.socket.id;

      const send = { key: "player:initialize", value: { color: this.color } };
      this.socket.emit(send.key, send.value);
      this.history.sent.push(send);

      this.statusText = "Socket connection created + Player initialized.";
    });
  }

  addHandler(name, handlerFunction) {
    this.socket.on(name, handlerFunction);
  }
}
