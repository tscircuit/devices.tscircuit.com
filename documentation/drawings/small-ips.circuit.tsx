import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "2.8-inch IPS display",
  usbPorts: [
    { ref: "J1", x: 0, y: -18.59, edge: "bottom" },
  ],
  "width": 36,
  "height": 38,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -15,
      -5
    ],
    [
      -15,
      5
    ],
    [
      15,
      -5
    ],
    [
      15,
      5
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelFile="small-ips.glb" />
