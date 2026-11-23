import { readdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const dir = import.meta.dir
const shared = await readFile(join(dir, "MountingSheet.tsx"), "utf8")
const requested = process.argv.slice(2)
for (const file of (await readdir(dir)).sort()) {
  if (!file.endsWith(".circuit.tsx")) continue
  const slug = file.replace(".circuit.tsx", "")
  if (requested.length && !requested.includes(slug)) continue

  const response = await fetch("https://svg.tscircuit.com/?svg_type=drawing&drawing=mounting", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      fs_map: {"MountingSheet.tsx": shared, [file]: await readFile(join(dir, file), "utf8")},
      main_component_path: file,
    }),
  })
  if (!response.ok || !response.headers.get("content-type")?.includes("image/svg+xml")) {
    throw new Error(slug + ": drawing export failed (" + response.status + ") " + await response.text())
  }
  const bytes = await response.bytes()
  const svg = new TextDecoder().decode(bytes)
  if (!svg.includes("data-part-label") || !svg.includes("data-drawing-dimension-line-id")) {
    throw new Error(slug + ": native drawing is missing connector labels or dimensions")
  }
  await writeFile(join(dir, "../static/img/devices", slug, "mounting.svg"), bytes)
  console.log("Exported", slug)
}
