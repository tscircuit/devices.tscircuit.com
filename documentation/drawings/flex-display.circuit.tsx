import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Flex display",
  usbPorts: [
    { ref: "J1", x: 0, y: -20.59, edge: "bottom" },
  ],
  "width": 32,
  "height": 42,
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

export default () => <MountingSheet mount={mount} modelFile="flex-display.glb" />
