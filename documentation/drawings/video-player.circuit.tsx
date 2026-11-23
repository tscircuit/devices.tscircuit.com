import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "3.5-inch video player",
  usbPorts: [
    { ref: "J1", x: 0, y: -23.39, edge: "bottom" },
  ],
  "width": 56,
  "height": 48,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -20,
      -15
    ],
    [
      -20,
      15
    ],
    [
      20,
      -15
    ],
    [
      20,
      15
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelFile="video-player.glb" />
