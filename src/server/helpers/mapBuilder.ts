export function mapBuilder(columns, rows, players) {
  const newMap = {
    size: 50,
    columns,
    rows,
    tiles: [],
  };

  for (let c = 0; c < columns; c++) {
    let newCol = [];
    for (let r = 0; r < rows; r++) {
      newCol.push({ player: null, power: 0, active: true });
    }
    newMap.tiles.push(newCol);
  }

  // maybe extract this elsewhere?
  newMap.tiles[0][0] = { player: players[0].playerId, power: 2, active: true };
  newMap.tiles[columns - 1][rows - 1] = {
    player: players[1].playerId,
    power: 2,
    active: true,
  };

  return newMap;
}
