import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "USB-C speaker",
  usbPorts: [
    { ref: "J1", x: 0, y: -14.59, edge: "bottom" },
  ],
  speakerHeader: { x: -4.8, y: 11.4 },
  "width": 26,
  "height": 30,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -10,
      -12.5
    ],
    [
      -10,
      7.5
    ],
    [
      10,
      -12.5
    ],
    [
      10,
      7.5
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelFile="speaker.glb" />
