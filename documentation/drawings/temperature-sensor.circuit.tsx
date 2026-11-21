import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "Temperature sensor",
  "usbEdge": "bottom",
  "width": 18,
  "height": 24,
  "thickness": 1.6,
  "diameter": 2.2,
  "holes": [
    [
      -5,
      8.8
    ],
    [
      5,
      8.8
    ]
  ]
} as const

export default () => <MountingSheet mount={mount} modelUrl="./models/temperature-sensor.glb" />
