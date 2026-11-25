const deviceReleases = "https://github.com/tscircuit/devices.tscircuit.com/releases/download"

function getCadRelease(board: string) {
  switch (board) {
    case "usb-resetter":
      return "https://github.com/tscircuit/basic-usbc-devices/releases/download/compact-resetter-v2"
    case "motherboard":
      return deviceReleases + "/compact-front-microsd-motherboard-v1"
    case "speaker":
    case "video-player":
    case "large-rgb":
      return deviceReleases + "/top-side-boards-v1"
    case "buzzer":
      return deviceReleases + "/embedded-boards-v1"
    default:
      return deviceReleases + "/board-cad-2026-11-21"
  }
}

export function getCadDownloadUrl(board: string, format: "glb" | "step") {
  return getCadRelease(board) + "/" + board + "." + format
}
