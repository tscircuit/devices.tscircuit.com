import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Four-port USB hub",
  usbPorts: [
    { ref: "J1", x: 0, y: -20.59, edge: "bottom", role: "Upstream" },
    { ref: "J2", x: -16.2, y: 20.59, edge: "top", role: "Downstream" },
    { ref: "J3", x: -5.4, y: 20.59, edge: "top", role: "Downstream" },
    { ref: "J4", x: 5.4, y: 20.59, edge: "top", role: "Downstream" },
    { ref: "J5", x: 16.2, y: 20.59, edge: "top", role: "Downstream" },
  ],
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
