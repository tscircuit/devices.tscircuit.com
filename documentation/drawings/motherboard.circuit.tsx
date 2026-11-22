import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Embedded motherboard",
  "usbEdge": "bottom",
  "width": 46,
  "height": 46,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -20,
      -5
    ],
    [
      -20,
      5
    ],
    [
      20,
      -5
    ],
    [
      20,
      5
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelUrl="./models/motherboard.glb" />
