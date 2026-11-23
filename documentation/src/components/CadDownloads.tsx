import React from "react"

const original = "https://github.com/tscircuit/devices.tscircuit.com/releases/download/board-cad-2026-11-21"

export default function CadDownloads({board}: {board: string}) {
  const release = board === "motherboard" ? "https://github.com/tscircuit/devices.tscircuit.com/releases/download/compact-front-microsd-motherboard-v1" : ["speaker","video-player","large-rgb"].includes(board) ? "https://github.com/tscircuit/devices.tscircuit.com/releases/download/top-side-boards-v1" : board === "buzzer" ? "https://github.com/tscircuit/devices.tscircuit.com/releases/download/embedded-boards-v1" : original
  return (
    <nav className="cad-downloads" aria-label="Download board CAD">
      <a href={release + "/" + board + ".glb"}>Download GLB</a>
      <a href={release + "/" + board + ".step"}>Download STEP</a>
    </nav>
  )
}
