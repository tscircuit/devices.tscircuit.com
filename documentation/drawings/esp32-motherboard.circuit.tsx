import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "ESP32-S3 Wi-Fi USB Motherboard",
  usbPorts: [
    { ref: "J1", x: -10.5, y: -22.59, edge: "bottom", role: "Console", labelOffset: [-18, -33] },
    { ref: "J2", labelOffset: [-34, 42], x: -26.7, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J3", x: -15.9, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J4", x: -5.1, y: 22.59, edge: "top", role: "Downstream" },
    { ref: "J5", x: 5.7, y: 22.59, edge: "top", role: "Downstream" },
  ],
  heightNote: "Power lever projects 4.75 mm past the J1 edge",
  controls: [
    { ref: "U_CPU", label: "ANT · RF coax", x: 33, y: 14.2, labelX: 48, labelY: 3 },
    { ref: "SW_BOOT", label: "BOOT", x: 30, y: 18.75, labelX: 47, labelY: 15 },
    { ref: "J_SD", label: "microSD", x: 23.4, y: -22.7, labelX: 42, labelY: -26 },
    { ref: "SW_POWER", label: "POWER", x: 5, y: -27.75, labelX: 13, labelY: -34 },
    { ref: "SW_RESET", label: "RESET", x: 14.5, y: 9, labelX: 39, labelY: 24 },
  ],
  "width": 76,
  "height": 46,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -35,
      -20
    ],
    [
      -35,
      20
    ],
    [
      35,
      -20
    ],
    [
      35,
      20
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelFile="esp32-motherboard.glb" modelRevision="75ab94a59f42c60e2e51d494e45264d02893805e" />
