import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Potentiometer",
  "heightNote": "Shaft tip: 20 mm above PCB top (without knob)",
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

export default () => <MountingSheet mount={mount} modelUrl="./models/potentiometer.glb" />
