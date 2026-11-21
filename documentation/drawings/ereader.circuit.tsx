import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "5.83-inch e-paper display",
  "usbEdge": "bottom",
  "width": 36,
  "height": 38,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -15,
      -10
    ],
    [
      -15,
      10
    ],
    [
      15,
      -10
    ],
    [
      15,
      10
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelUrl="./models/ereader.glb" />
