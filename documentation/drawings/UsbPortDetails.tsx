import React from "react"
import type {Mount} from "./MountingSheet"

// HRO TYPE-C-31-M-12 shell envelope, in mm. The front rim faces the cable.
const shellWidth = 8.94
const shellDepth = 7.9
const angle = {bottom: 0, left: 90, top: 180, right: 270}
const inward = {bottom: [0,-1], left: [1,0], top: [0,1], right: [-1,0]}

export function UsbPortPlan({ports, planScale}: {ports: Mount["usbPorts"], planScale: number}) {
  const w = shellWidth * planScale, h = shellDepth * planScale
  return <g fontFamily="Arial, sans-serif" fill="#232323" textAnchor="middle">
    {ports.map(port => {
      // The native component-side viewport is centered at (61, 82) on this sheet.
      const x = 61 + port.x * planScale, y = 82 - port.y * planScale
      const [dx, dy] = inward[port.edge]
      const twoLines = ports.length === 1
      const labelX = dx * h / 2, labelY = dy * h / 2
      return <g key={port.ref} data-usb-port={port.ref} transform={`translate(${x} ${y})`}>
        <title>{[port.ref, "USB-C", port.role, port.edge + " edge"].filter(Boolean).join(" · ")}</title>
        <g transform={`rotate(${angle[port.edge]})`} stroke="#232323" strokeWidth=".45">
          <rect x={-w/2} y={-h} width={w} height={h} rx=".65" fill="white" />
          <path d={`M${-w/2} ${-0.75*planScale} h${w}`} fill="none" />
        </g>
        <text x={labelX} y={labelY + (twoLines ? -.3 : 1)} fontSize={Math.min(3.6, w*.4)} fontWeight="bold">{port.ref}</text>
        {twoLines && <text x={labelX} y={labelY + 2.8} fontSize="2.7">USB-C</text>}
      </g>
    })}
  </g>
}

export function UsbPortLegend({ports}: {ports: Mount["usbPorts"]}) {
  const groups = new Map<string, string[]>()
  for (const port of ports) {
    const key = port.role ?? ""
    const refs = groups.get(key) ?? []
    refs.push(port.ref)
    groups.set(key, refs)
  }
  return <g fontSize="3.45">
    {Array.from(groups, ([role, refs], i) => (
      <text key={role} x="148" y={140.5 + 6*i}>
        <tspan fontWeight="bold">{refs.join(", ")}</tspan>
        {"  USB-C"}{role && " · " + role}
      </text>
    ))}
  </g>
}
