import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Pushbutton",
  "usbEdge": "bottom",
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

export default () => <MountingSheet mount={mount} modelUrl="./models/button.glb" />
