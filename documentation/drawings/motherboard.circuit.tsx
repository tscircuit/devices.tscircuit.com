import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "RP2350 USB Motherboard",
  usbPorts: [
    { ref: "J1", x: -14, y: -22.59, edge: "bottom", role: "Computer / service" },
    { ref: "J2", x: -30.2, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J3", x: -19.4, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J4", x: -8.6, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J5", x: 2.2, y: 22.59, edge: "top", role: "Downstream" },
  ],
  "width": 80,
  "height": 46,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -38,
      -20
    ],
    [
      -38,
      20
    ],
    [
      32,
      -20
    ],
    [
      32,
      20
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelFile="motherboard.glb" />
