import React from "react"
import { MountingSheet } from "./MountingSheet"

export const mount = {
  "title": "USB-C speaker",
  "usbEdge": "bottom",
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

export default () => <MountingSheet mount={mount} modelUrl="./models/speaker.glb" />

// The plan centres the 26 × 30 mm board at (61, 82) on the sheet.
// Use its exported scale to locate the header from the PCB footprint origin.
export function SheetCallout({planScale}: {planScale: number}) {
  const x = 61 - 4.8 * planScale
  const y = 82 - 11.4 * planScale
  return <g fontFamily="Arial, sans-serif" fill="#171717">
    <title>J2 speaker connector location and pinout</title>
    <g transform={`translate(${x} ${y})`}>
      <rect x={-2 * planScale} y={-1.45 * planScale} width={4 * planScale}
        height={2.9 * planScale} fill="white" stroke="currentColor" strokeWidth=".45" />
      <text x={2 * planScale + 1.5} y="1.2" fontSize="3.6" fontWeight="bold">J2</text>
    </g>
    <text x="112" y="27" fontSize="4.6" fontWeight="bold">J2 · Speaker connector</text>
    <text x="112" y="33" fontSize="3.8">JST SH · 2 pins · 1.0 mm pitch · top entry</text>
    <text x="112" y="39" fontSize="3.4">Board header  BM02B-SRSS-TB</text>
    <text x="112" y="44" fontSize="3.4">Cable housing  SHR-02V-S-B</text>
    <text x="112" y="49" fontSize="3.4">Pin 1  red (+)   ·   Pin 2  black (−)</text>
    <path d="M162 44 H215 V61 L198.5 79.8" fill="none" stroke="white" strokeWidth="1.5" />
    <path d="M162 44 H215 V61 L198.5 79.8" fill="none" stroke="#171717" strokeWidth=".45" />
    <circle cx="198.5" cy="79.8" r="1" stroke="white" strokeWidth=".3" />
  </g>
}
