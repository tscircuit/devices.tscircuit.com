import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "USB-C speaker",
  "usbEdge": "bottom",
  "width": 26,
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

export default () => <MountingSheet mount={mount} modelUrl="./models/speaker.glb" />
