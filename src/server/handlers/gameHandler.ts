export const gameHandler = (io, socket) => {
  const createGame = (payload) => {
    console.log('game:create > payload: ', payload);
  };
  const updateGame = (x) => {
    console.log('updateGame, x: ');
    console.log(x);
  };

  socket.on('game:create', createGame);
  socket.on('game:update', updateGame);
};
