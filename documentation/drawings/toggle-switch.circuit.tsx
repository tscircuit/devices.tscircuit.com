import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Toggle switch",
  "heightNote": "Lever tip in modeled position: approx. 26.5 mm above PCB top",
  usbPorts: [
    { ref: "J1", x: 0, y: -14.59, edge: "bottom" },
  ],
  "width": 24,
  "height": 30,
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

export default () => <MountingSheet mount={mount} modelFile="toggle-switch.glb" modelRevision="7c4742cff2eed1688d3db168575774245cdc291e" />
