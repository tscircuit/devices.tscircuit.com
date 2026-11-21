import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "3.5-inch video player",
  "usbEdge": "bottom",
  "width": 48,
  "height": 48,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -20,
      -15
    ],
    [
      -20,
      15
    ],
    [
      20,
      -15
    ],
    [
      20,
      15
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelUrl="./models/video-player.glb" />
