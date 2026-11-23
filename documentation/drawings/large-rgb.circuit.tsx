import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "7-inch RGB display",
  usbPorts: [
    { ref: "J1", x: 0, y: -26.39, edge: "bottom" },
  ],
  "width": 54,
  "height": 54,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -20,
      -20
    ],
    [
      -20,
      20
    ],
    [
      20,
      -20
    ],
    [
      20,
      20
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelFile="large-rgb.glb" />
