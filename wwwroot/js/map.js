const palette = {
  background: '#0d0d0d',
  blue: '#29C2DE',
  green: '#26C99E',
  indigo: '#CC78FA',
  violet: '#C724B1',
  dark_teal: '#005151',
  light_teal: '#30CEBB',
  white: '#FFFFFF',
  dark_gray: '#53565A'
};

const HexSize = 50;
const HexColumns = 12;
const HexRows = 7;
const HexSetup = [
  [
    { player: 'A', power: 2, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: 'B', power: 2, active: true }
  ]
];

const gameConfig = [
  HexSetup,
  HexColumns,
  HexRows,
  HexSize
];