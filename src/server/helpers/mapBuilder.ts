export function mapBuilder(columns, rows, players) {
  const playerArray = Object.values(players) as any[];

  const newMap = {
    size: 50,
    columns,
    rows,
    tiles: [],
  };

  for (let c = 0; c < columns; c++) {
    let newCol = [];
    for (let r = 0; r < rows; r++) {
      newCol.push({ player: null, power: 0, active: true, color: null });
    }
    newMap.tiles.push(newCol);
  }

  // Assign starting tiles to players
  if (playerArray.length >= 2) {
    newMap.tiles[0][0] = {
      player: playerArray[0],
      power: 2,
      active: true,
      color: playerArray[0].color,
    };
    newMap.tiles[columns - 1][rows - 1] = {
      player: playerArray[1],
      power: 2,
      active: true,
      color: playerArray[1].color,
    };
  }

  return newMap;
}
