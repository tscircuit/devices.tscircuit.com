import { MountingSheet } from "./MountingSheet"

export const mount = {
  title: "USB resetter · compact revision",
  usbPorts: [
    { ref: "J1", x: 4, y: 14.74, edge: "top", role: "Control" },
    { ref: "J2", x: -17.74, y: -1.2, edge: "left", role: "Switched output" },
    { ref: "J3", x: 17.74, y: -1.2, edge: "right", role: "Passthrough input" },
  ],
  controls: [
    { ref: "D1_D3", label: "RGB indicator", x: -3, y: -12, labelX: 18, labelY: -43 },
  ],
  width: 36, height: 30, thickness: 1.6, diameter: 2.2,
  holes: [[-15,-10],[-15,10],[15,-10],[15,10]],
} as const

export default () => <MountingSheet mount={mount} modelFile="usb-resetter.glb" modelRevision="43c8996c5590ea6f60385463193cff4e00dddaec" />
