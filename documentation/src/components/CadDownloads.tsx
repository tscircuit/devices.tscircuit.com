import React from "react"

const release = "https://github.com/tscircuit/devices.tscircuit.com/releases/download/board-cad-2026-11-21"

export default function CadDownloads({board}: {board: string}) {
  return (
    <nav className="cad-downloads" aria-label="Download board CAD">
      <a href={release + "/" + board + ".glb"}>Download GLB</a>
      <a href={release + "/" + board + ".step"}>Download STEP</a>
    </nav>
  )
}
