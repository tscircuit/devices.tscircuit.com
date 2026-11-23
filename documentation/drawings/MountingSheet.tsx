import { assembly } from "tscircuit"

// x and y locate the centre of the shield opening in PCB coordinates (mm).
export interface UsbPort {
  ref: string
  x: number
  y: number
  edge: "top" | "bottom" | "left" | "right"
  role?: string
}

export interface Mount {
  title: string
  heightNote?: string
  usbPorts: readonly [UsbPort, ...UsbPort[]]
  width: number
  height: number
  thickness: number
  diameter: number
  holes: readonly (readonly [number, number])[]
}

// The native z+ camera presents board +X to the left and +Y down.
// Turn the plan through 180° so paper +X is right and board +Y is up.
export function MountingSheet({mount, modelUrl}: {mount: Mount, modelUrl: string}) {
  const {width, height, thickness, diameter, holes} = mount
  // For each pitch, pick the extreme holes nearest the top or right dimension.
  const pitch = (axis: 0 | 1) => {
    const other = axis === 0 ? 1 : 0
    const indices = holes.map((_, i) => i)
    const extreme = (sign: number) => indices.reduce((best, i) => {
      const delta = sign * (holes[i][axis] - holes[best][axis])
      return delta > 0 || (delta === 0 && holes[i][other] > holes[best][other]) ? i : best
    })
    if (!indices.length) return
    const start = extreme(-1), end = extreme(1)
    if (holes[start][axis] === holes[end][axis]) return
    return {fromRef: ".H" + (start + 1), toRef: ".H" + (end + 1)}
  }
  const horizontal = pitch(0)
  const vertical = pitch(1)
  return (
    <assembly.device>
      <board name="carrier" width={width} height={height} thickness={thickness} routingDisabled>
        {holes.map(([x, y], i) => (
          <hole key={i} name={"H" + (i+1)} pcbX={-x} pcbY={-y} diameter={diameter} />
        ))}
      </board>
      <assembly.part name="populated" modelUrl={modelUrl} />
      <assembly.drawing.page name="mounting" width={240} height={160}>
        <assembly.drawing.partview name="plan" displayName="Component side" partRef=".carrier"
          direction="z+" width={72} height={72} centerX={-59} centerY={-2}>
          {horizontal && <assembly.drawing.dimension name="horizontal-pitch" {...horizontal} axis="x" />}
          {vertical && <assembly.drawing.dimension name="vertical-pitch" {...vertical} axis="y" />}
          <assembly.drawing.dimension name="width" widthOfView />
          <assembly.drawing.dimension name="height" heightOfView />
        </assembly.drawing.partview>
        <assembly.drawing.partview name="iso" displayName="Assembled board · isometric"
          partRef=".populated" direction="isometric" width={90} height={77} centerX={54} centerY={0} />
      </assembly.drawing.page>
    </assembly.device>
  )
}
