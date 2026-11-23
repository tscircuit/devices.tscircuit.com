import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Buzzer",
  usbPorts: [
    { ref: "J1", x: 0, y: -14.59, edge: "bottom" },
  ],
  "width": 24,
  "height": 30,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -10,
      -12.5
    ],
    [
      -10,
      7.5
    ],
    [
      10,
      -12.5
    ],
    [
      10,
      7.5
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelUrl="./models/buzzer.glb" />
