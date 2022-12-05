const palette = {
  background: '#0d0d0d',
  blue: '#29C2DE',
  green: '#26C99E',
  indigo: '#CC78FA',
  violet: '#C724B1',
  dark_teal: '#005151',
  light_teal: '#30CEBB',
	red: '#DD5E89',
  white: '#FFFFFF',
  dark_gray: '#53565A'
};

const map1 = {
	size: 50,
	columns: 12,
	rows: 7, 
	tiles: [
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
]
}

const map2 = {
	size: 50,
	columns: 8,
	rows: 5,
	tiles: [
  [
    { player: 'A', power: 2, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true }
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true }
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true }
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true }
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true }
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true }
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true }
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: 'B', power: 2, active: true }
  ]
]
}

const map3 = {
	size: 50,
	columns: 6,
	rows: 6,
	tiles: [
  [
    { player: 'A', power: 2, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true }
  ],
  [
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
  ],
  [
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
  ],
  [
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: null, power: 0, active: true },
    { player: 'B', power: 2, active: true }
  ]
]
}
