var gameController = new Game();
var sessionController = new Session();

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

sessionController.config(function (roomInfo) {
  var mapConfig = roomInfo.map;

  const canvasWidth =
    2 * mapConfig.columns + mapConfig.size * 1.6 * mapConfig.columns;
  const canvasHeight = mapConfig.rows * mapConfig.size * 2;
  canvas.setAttribute("width", `${canvasWidth}px`);
  canvas.setAttribute("height", `${canvasHeight}px`);

  gameController.config({ ...mapConfig, players: roomInfo.players });
  gameController.bindSession(sessionController);
  gameController.start();
});

sessionController.connect();

$(document).ready(function () {
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

  $("#resetGame").prop("disabled", true);
});
