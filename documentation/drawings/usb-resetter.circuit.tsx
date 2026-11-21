import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "USB resetter",
  "usbEdge": "top",
  "width": 42,
  "height": 42,
  "thickness": 1.6,
  "diameter": 3.2,
  "holes": [
    [
      -17.5,
      -17.5
    ],
    [
      -17.5,
      3.5
    ],
    [
      17.5,
      -17.5
    ],
    [
      17.5,
      3.5
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelUrl="./models/usb-resetter.glb" />
