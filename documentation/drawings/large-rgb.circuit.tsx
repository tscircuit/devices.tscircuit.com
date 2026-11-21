import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "7-inch RGB display",
  "usbEdge": "bottom",
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

export default () => <MountingSheet mount={mount} modelUrl="./models/large-rgb.glb" />
