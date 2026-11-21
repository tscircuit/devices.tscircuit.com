import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Compact pushbutton",
  "usbEdge": "bottom",
  "width": 20,
  "height": 26,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -7.5,
      -6
    ],
    [
      -7.5,
      4
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelUrl="./models/compact-button.glb" />
