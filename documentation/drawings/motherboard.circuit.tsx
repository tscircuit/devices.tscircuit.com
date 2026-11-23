import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "RP2350 USB Motherboard",
  usbPorts: [
    { ref: "J1", x: -14, y: -22.59, edge: "bottom", role: "Console / program" },
    { ref: "J2", x: -30.2, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J3", x: -19.4, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J4", x: -8.6, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J5", x: 2.2, y: 22.59, edge: "top", role: "Downstream" },
  ],
  controls: [
    { ref: "SW_MODE", label: "RUN / PROGRAM", x: 15, y: 18, labelX: 31, labelY: 36 },
    { ref: "SW_POWER", label: "POWER", x: 16.25, y: -22.5, labelX: 18, labelY: -44 },
    { ref: "SW_RESET", label: "RESET", x: 35.5, y: -9.5, labelX: 49, labelY: 4 },
    { ref: "SW_BOOT", label: "BOOT", x: 35.5, y: -15.5, labelX: 49, labelY: -15 },
  ],
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

export default () => <MountingSheet mount={mount} modelFile="motherboard.glb" modelRevision="0eeaa87912e2c59cacce3bdfeb601136858639ff" />
