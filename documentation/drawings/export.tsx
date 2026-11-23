import { readdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { Circuit } from "tscircuit"
import { renderMountingSheet } from "./render-mounting-sheet"

const dir = fileURLToPath(new URL(".", import.meta.url))
const requested = process.argv.slice(2)
for (const file of (await readdir(dir)).sort()) {
  if (!file.endsWith(".circuit.tsx")) continue
  const slug = file.replace(".circuit.tsx", "")
  if (requested.length && !requested.includes(slug)) continue

  const { default: Drawing } = await import(join(dir, file))
  const circuit = new Circuit()
  circuit.add(<Drawing />)
  await circuit.renderUntilSettled()
  const elements = circuit.getCircuitJson()
  const errors = elements.filter(e => e.type.endsWith("_error"))
  if (errors.length) throw new Error(slug + ": " + JSON.stringify(errors))

  const svg = await renderMountingSheet(elements)
  for (const [type, attribute] of [
    ["drawing_part_view", "data-drawing-part-view-id"],
    ["drawing_part_label", "data-part-label"],
    ["drawing_dimension_line", "data-drawing-dimension-line-id"],
  ] as const) {
    const expected = elements.filter(e => e.type === type).length
    const actual = svg.split(attribute + "=").length - 1
    if (!expected || actual !== expected)
      throw new Error(`${slug}: expected ${expected} ${type} elements, received ${actual}`)
  }
  await writeFile(join(dir, "../static/img/devices", slug, "mounting.svg"), svg)
  console.log("Exported", slug)
}
