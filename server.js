const { randomUUID } = require("crypto");
const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");

const app = express();
var server = http.Server(app);
var io = socketIO(server, {
  pingTimeout: 60000,
});

const mapBuilder = require("./map-builder");

app.set("port", 5000);
app.use("/static", express.static(__dirname + "/static"));

app.get("/", function (request, response) {
  response.sendFile(path.join(__dirname, "index.html"));
});

server.listen(5000, function () {
  console.log("Starting server on port 5000");
});

var rooms = {};
const players = {};

io.on("connection", function (socket) {
  console.log("player [" + socket.id + "] connected");

  socket.on("initialize", (playerInfo) => {
    // create new player
    players[socket.id] = {
      playerId: socket.id,
      color: playerInfo.color,
    };

    // find open room (if any)
    let openRoom = findOpenRoom();

    // if there are open rooms, add player to room
    // otherwise, create new room with player
    if (openRoom) {
      console.log("Found an open room!");

      rooms[openRoom].players = [
        ...rooms[openRoom].players,
        players[socket.id],
      ];

      console.log("Added player to room.");

      if (rooms[openRoom].players.length >= 2) {
        rooms[openRoom].locked = true;
        rooms[openRoom].status = "Ready";
      }

      socket.join(openRoom);
      io.to(openRoom).emit("GameSessionReady", rooms[openRoom]);
    } else {
      console.log("No open rooms found.");
      const newGameRoom = {
        roomId: randomUUID(),
        players: [players[socket.id]],
        status: "WaitingForPlayers",
        locked: false,
      };

      rooms[newGameRoom.roomId] = newGameRoom;

      socket.join(newGameRoom.roomId);
      io.to(newGameRoom.roomId).emit("WaitForEnemyConnect", newGameRoom);
      // exclude the sender: socket.to(newGameRoom.roomId).emit();

      console.log("Created a new room and added player.");
      //socket.emit("WaitForEnemyConnect", newGameRoom);
    }

    showServerState("initialize");
  });

  socket.on("attack", function (clientEvent) {
    console.log('clientEvent ("attack"): ', clientEvent);
  });

  socket.on("disconnecting", () => {
    console.log(
      "player [" + socket.id + "] disconnecting from rooms: ",
      socket.rooms
    );
  });

  socket.on("disconnect", () => {
    // remove player from ALL rooms
    console.log("player [" + socket.id + "] disconnected");

    // @TODO - provide more graceful disconnection handling
    // also, inform the other player clients, since they may
    // need to be manually disconnected.
    removePlayerFromAllRooms(socket.id);
    removeEmptyRooms();

    delete players[socket.id];
    io.emit("DisconnectPlayer", { playerId: socket.id });

    showServerState("disconnect");
  });

  showServerState("connect");
});

function findOpenRoom() {
  return Object.keys(rooms).find((roomId) => !rooms[roomId].locked) || false;
}

function removePlayerFromAllRooms(playerId) {
  for (let room of Object.keys(rooms)) {
    let newPlayerList = rooms[room].players.filter(
      (player) => player.playerId !== playerId
    );

    rooms[room].players = [...newPlayerList];
  }
}

function removeEmptyRooms() {
  for (let room of Object.keys(rooms)) {
    if (rooms[room].players.length < 1) {
      delete rooms[room];
    }
  }
}

function showServerState(type) {
  console.log(`=======Server State (${type})=======`);
  console.log("Rooms: ", rooms);
  console.log("Players: ", players);
  console.log("=====================");
}
