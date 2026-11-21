import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Four-port USB hub",
  "usbEdge": "bottom",
  "width": 44,
  "height": 42,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -19,
      -5
    ],
    [
      -19,
      5
    ],
    [
      19,
      -5
    ],
    [
      19,
      5
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelUrl="./models/usb-hub.glb" />
