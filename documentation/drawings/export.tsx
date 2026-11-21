import React from "react"
import {renderToStaticMarkup} from "react-dom/server"
import {readdir, readFile, writeFile, mkdtemp, rm} from "node:fs/promises"
import {join} from "node:path"
import {tmpdir} from "node:os"
import { $ } from "bun"
import type {Mount} from "./MountingSheet"

// Both views and all dimension leaders come from the native drawing exporter.
function SheetDetails({m}: {m: Mount}) {
  const xs = [...new Set(m.holes.map(([x]) => +(x + m.width/2).toFixed(3)))]
  const ys = [...new Set(m.holes.map(([,y]) => +(y + m.height/2).toFixed(3)))]
  return <g fontFamily="Arial, sans-serif" fill="#232323">
    <text x="8" y="13" fontSize="6" fontWeight="600">{m.title}</text>
    <text x="232" y="12" textAnchor="end" fontSize="3.2">MOUNTING  /  mm</text>
    <path d="M8 18 H232 M8 134 H232" stroke="#969696" strokeWidth=".28" />
    {m.heightNote && <text x="8" y="26" fontSize="3.8">{m.heightNote}</text>}
    <text x="149" y="143" fontSize="3.3">J1 USB-C on {m.usbEdge} edge of plan</text>
    <text x="8" y="143" fontSize="3.6">{m.holes.length} × Ø{m.diameter} through · {m.thickness} thick PCB</text>
    <text x="8" y="151" fontSize="3.5">Hole centres from lower-left PCB corner: X = {xs.join(", ")} mm; Y = {ys.join(", ")} mm</text>
  </g>
}

const dir = import.meta.dir
const temp = await mkdtemp(join(tmpdir(), "device-sheets-"))
try {
  for (const file of (await readdir(dir)).filter(f => f.endsWith(".circuit.tsx"))) {
    const slug = file.replace(".circuit.tsx", "")
    const assetDir = join(dir, "../static/img/devices", slug)
    const raw = join(temp, slug + ".svg")
    await $`tsci export ${join(dir,file)} --drawing mounting -o ${raw}`.cwd(dir)
    const {mount} = await import(join(dir,file))
    const details = renderToStaticMarkup(<SheetDetails m={mount}/>)
    const sheet = (await readFile(raw,"utf8")).replace("</svg>",details+"</svg>")
    if (!sheet.includes("drawing_dimension_line") || !sheet.includes("Assembled board · isometric")) throw Error("Incomplete sheet: "+slug)
    await writeFile(join(assetDir,"mounting.svg"),sheet)
  }
} finally {
  await rm(temp,{force:true,recursive:true})
}
