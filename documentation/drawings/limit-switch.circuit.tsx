import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Limit switch",
  "heightNote": "Roller lever in modeled position: approx. 14.8 mm above PCB top",
  usbPorts: [
    { ref: "J1", x: 0, y: -14.59, edge: "bottom" },
  ],
  "width": 24,
  "height": 30,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -9.5,
      -12.5
    ],
    [
      -9.5,
      12.5
    ],
    [
      9.5,
      -12.5
    ],
    [
      9.5,
      12.5
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelFile="limit-switch.glb" />
