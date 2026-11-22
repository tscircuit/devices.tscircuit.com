import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "RP2350 USB Motherboard",
  "usbEdge": "bottom",
  "width": 80,
  "height": 46,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -38,
      -20
    ],
    [
      -38,
      20
    ],
    [
      32,
      -20
    ],
    [
      32,
      20
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelUrl="./models/motherboard.glb" />
