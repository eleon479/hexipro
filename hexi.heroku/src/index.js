const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");

// express app setup
const PORT = process.env.PORT || 3000;
const app = express()
  .set("port", PORT)
  .use("/", express.static(__dirname + "/client"));

/*
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, INDEX));
});
*/

// socket server setup
var server = http.Server(app);
var io = socketIO(server);

server.listen(PORT, () => console.log(`Listening on ${PORT}`));

// utilities
const mapBuilder = require("./server/maps/mapBuilder");

// repositories
const playerPoolRepository = require("./server/services/playerPoolRepository");
const gameRoomRepository = require("./server/services/gameRoomRepository");
const stateContext = {
  playerPool: playerPoolRepository,
  gameRooms: gameRoomRepository,
  services: {
    mapBuilder: mapBuilder,
  },
};

// handlers
const registerGameHandlers = require("./server/handlers/gameHandler");
const registerPlayerHandlers = require("./server/handlers/playerHandler");

const onConnection = (socket) => {
  console.log("connection");
  socket.emit("game", { x: "Welcome, ", y: socket.id });

  registerPlayerHandlers(io, socket, stateContext);
  registerGameHandlers(io, socket, stateContext);
};

io.on("connection", onConnection);
