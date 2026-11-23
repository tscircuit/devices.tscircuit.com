import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "USB resetter",
  usbPorts: [
    { ref: "J1", x: 4, y: 20.69, edge: "top", role: "Control" },
    { ref: "J2", x: -20.69, y: -7, edge: "left", role: "Switched output" },
    { ref: "J3", x: 20.69, y: -7, edge: "right", role: "Passthrough input" },
  ],
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

export default () => <MountingSheet mount={mount} modelFile="usb-resetter.glb" />
