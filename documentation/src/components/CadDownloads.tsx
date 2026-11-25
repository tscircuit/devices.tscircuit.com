import React from "react"
import { getCadDownloadUrl } from "../../drawings/cad-release"

export default function CadDownloads({board}: {board: string}) {
  return (
    <nav className="cad-downloads" aria-label="Download board CAD">
      <a href={getCadDownloadUrl(board, "glb")}>Download GLB</a>
      <a href={getCadDownloadUrl(board, "step")}>Download STEP</a>
    </nav>
  )
}
