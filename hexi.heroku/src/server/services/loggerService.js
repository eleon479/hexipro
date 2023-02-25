module.exports = {
  showServerState: (type, context) => {
    console.log(`=======Server State (${type})=======`);
    console.log("Rooms: ", context.rooms);
    console.log("Players: ", context.players);
    console.log("=====================");
  },
};
