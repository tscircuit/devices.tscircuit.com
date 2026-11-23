import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "RP2350 USB Motherboard",
  usbPorts: [
    { ref: "J1", x: -14, y: -22.59, edge: "bottom", role: "Console", labelOffset: [-18, -33] },
    { ref: "J2", labelOffset: [-34, 42], x: -30.2, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J3", x: -19.4, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J4", x: -8.6, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J5", x: 2.2, y: 22.59, edge: "top", role: "Downstream" },
  ],
  heightNote: "Power lever projects 4.75 mm past the J1 edge",
  swdHeader: true,
  controls: [
    { ref: "J_SWD", label: "J_SWD · JST SH", x: 15, y: 18, labelX: 32, labelY: 36 },
    { ref: "J_SD", label: "microSD", x: 43.6, y: -8.95, labelX: 52, labelY: -14 },
    { ref: "SW_POWER", label: "POWER", x: 15.25, y: -27.75, labelX: 41, labelY: -32 },
    { ref: "SW_RESET", label: "RESET", x: 35.5, y: 16, labelX: 50, labelY: 16 },
  ],
  "width": 88,
  "height": 46,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -40,
      -20
    ],
    [
      -40,
      20
    ],
    [
      40,
      -20
    ],
    [
      40,
      20
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelFile="motherboard.glb" modelRevision="28e5051c0660aafe3eaeb988261b76ffa54298a9" />
