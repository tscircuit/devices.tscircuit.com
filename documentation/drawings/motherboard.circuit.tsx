import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "RP2350 USB Motherboard",
  usbPorts: [
    { ref: "J1", x: -10.5, y: -22.59, edge: "bottom", role: "Console", labelOffset: [-18, -33] },
    { ref: "J2", labelOffset: [-34, 42], x: -26.7, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J3", x: -15.9, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J4", x: -5.1, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J5", x: 5.7, y: 22.59, edge: "top", role: "Downstream" },
  ],
  heightNote: "Power lever projects 4.75 mm past the J1 edge",
  swdHeader: true,
  controls: [
    { ref: "J_SWD", label: "J_SWD · JST SH", x: 33, y: -2, labelX: 46, labelY: 3 },
    { ref: "J_SD", label: "microSD", x: 23.4, y: -22.7, labelX: 42, labelY: -26 },
    { ref: "SW_POWER", label: "POWER", x: 5, y: -27.75, labelX: 13, labelY: -34 },
    { ref: "SW_RESET", label: "RESET", x: 15.75, y: 6, labelX: 39, labelY: 24 },
  ],
  "width": 76,
  "height": 46,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -35,
      -20
    ],
    [
      -35,
      20
    ],
    [
      35,
      -20
    ],
    [
      35,
      20
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelFile="motherboard.glb" modelRevision="79be24743b97f8511803ff3bcd1c76675e5aff84" />
