import { convertCircuitJsonToDrawingPages } from "@tscircuit/circuit-json-to-drawing"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { mat4 } from "gl-matrix"
import { createSceneFromGLTF, loadGLTFWithResourcesFromURL } from "poppygl"

async function loadScene(elements: AnyCircuitElement[]) {
  const glb = await convertCircuitJsonToGltf(elements, {
    format: "glb", includeModels: true, showBoundingBoxes: false,
  })
  const url = "data:model/gltf-binary;base64," + Buffer.from(glb as ArrayBuffer).toString("base64")
  const { gltf, resources } = await loadGLTFWithResourcesFromURL(url)
  return createSceneFromGLTF(gltf, resources)
}

export async function renderMountingSheet(elements: AnyCircuitElement[]) {
  const board = elements.find(e => e.type === "pcb_board")
  const group = elements.find(e => e.type === "source_group" && e.subcircuit_id === board?.subcircuit_id)
  const populated = elements.find(e => e.type === "source_component" && e.name === "populated")
  const page = elements.find(e => e.type === "drawing_page" && e.name === "mounting")
  if (!board || group?.type !== "source_group" || populated?.type !== "source_component" || page?.type !== "drawing_page") {
    throw new Error("Mounting sheet requires a carrier board, populated assembly and mounting page")
  }
  const [carrier, assembly] = await Promise.all([
    loadScene(elements.filter(e => e.type.startsWith("pcb_") && "subcircuit_id" in e && e.subcircuit_id === board.subcircuit_id)),
    loadScene(elements.filter(e => "source_component_id" in e && e.source_component_id === populated.source_component_id)),
  ])
  if (!carrier.drawCalls.length || !assembly.drawCalls.length) throw new Error("Missing mounting sheet geometry")

  // The glTF exporter uses (-x, z, y). The native assembly renderer places
  // callout anchors in (x, z, -y), a half-turn around the glTF Y axis.
  const cadFrame = mat4.fromYRotation(mat4.create(), Math.PI)
  const [drawing] = await convertCircuitJsonToDrawingPages(elements, {
    drawingPageId: page.drawing_page_id,
    resolveScene: view => {
      if (view.source_group_id === group.source_group_id) return carrier
      if (view.source_component_ids?.includes(populated.source_component_id)) return assembly
      throw new Error("Unknown mounting view " + view.name)
    },
    resolveSceneParts: () => [{
      source_component_id: populated.source_component_id,
      drawCalls: assembly.drawCalls.map(call => ({
        ...call, model: mat4.multiply(mat4.create(), cadFrame, call.model),
      })),
    }],
  })
  return drawing.svg
}
