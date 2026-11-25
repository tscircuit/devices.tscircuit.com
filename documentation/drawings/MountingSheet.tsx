import { assembly } from "tscircuit"

// x and y locate the centre of the shield opening in PCB coordinates (mm).
export interface UsbPort {
  ref: string
  x: number
  y: number
  edge: "top" | "bottom" | "left" | "right"
  labelOffset?: readonly [number, number]
  role?: string
}

export interface Mount {
  swdHeader?: boolean
  undersidePads?: string
  controls?: readonly { ref: string, label: string, x: number, y: number, labelX: number, labelY: number }[]
  speakerHeader?: { x: number, y: number }
  title: string
  heightNote?: string
  usbPorts: readonly [UsbPort, ...UsbPort[]]
  width: number
  height: number
  thickness: number
  diameter: number
  holes: readonly (readonly [number, number])[]
}

// The populated meshes were exported with both in-plane axes reversed.
const originalModels = "7f0d761136554d8b8678c0baae401596f2de888a"

type DrawingModel =
  | { releaseGlbUrl: string }
  | { modelFile: string, modelRevision?: string }

export function MountingSheet(props: {mount: Mount} & DrawingModel) {
  const { mount } = props
  // Release assemblies are meter-scale and Y-up. Legacy drawing meshes are in mm and Z-up.
  const cadModel = "releaseGlbUrl" in props
    ? {
        glbUrl: props.releaseGlbUrl,
        modelUnitToMmScale: 1000,
        rotationOffset: {x: -90, y: 0, z: 180},
      }
    : {
        glbUrl: `https://raw.githubusercontent.com/tscircuit/devices.tscircuit.com/${props.modelRevision ?? originalModels}/documentation/drawings/models/${props.modelFile}`,
        rotationOffset: {x: 0, y: 0, z: 180},
      }
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
  const holeOffsets = (axis: 0 | 1, size: number) =>
    [...new Set(holes.map(point => +(point[axis] + size / 2).toFixed(3)))].join(", ")
  const topPorts = mount.usbPorts.filter(port => port.edge === "top")
  const portLabel = (port: UsbPort) => {
    if (port.labelOffset) return { xOffsetFromViewCenter: port.labelOffset[0], yOffsetFromViewCenter: port.labelOffset[1] }
    const topIndex = topPorts.indexOf(port)
    if (port.edge === "top") return {
      xOffsetFromViewCenter: topPorts.length === 1 ? 10 : -38 + topIndex * 20,
      yOffsetFromViewCenter: 50,
    }
    if (port.edge === "left") return { xOffsetFromViewCenter: -54, yOffsetFromViewCenter: -23 }
    if (port.edge === "right") return { xOffsetFromViewCenter: 40, yOffsetFromViewCenter: -23 }
    return { xOffsetFromViewCenter: 45, yOffsetFromViewCenter: -32 }
  }
  return (
    <assembly.device>
      {/* Board geometry in the z+ mounting view has both PCB axes reversed. */}
      <board name="carrier" width={width} height={height} thickness={thickness} routingDisabled>
        {holes.map(([x, y], i) => (
          <hole key={i} name={"H" + (i+1)} pcbX={-x} pcbY={-y} diameter={diameter} />
        ))}
      </board>
      <assembly.part name="populated" cadModel={{...cadModel, modelOriginPosition: {x: 0, y: 0, z: 0}}} />
      <assembly.drawing.page name="mounting" width={360} height={190}>
        <assembly.drawing.note name="title" text={mount.title} paperX={-169} paperY={80} fontSize={6} />
        <assembly.drawing.note text="Mounting dimensions in mm" paperX={90} paperY={80} fontSize={3.3} />
        {mount.heightNote && <assembly.drawing.note text={mount.heightNote} paperX={-169} paperY={69} fontSize={3.6} />}
        <assembly.drawing.partview name="plan" displayName="Mounting holes · component side" partRef=".carrier"
          direction="z+" width={76} height={76} centerX={-120} centerY={0}>
          {horizontal && <assembly.drawing.dimension name="horizontal-pitch" {...horizontal} axis="x" />}
          {vertical && <assembly.drawing.dimension name="vertical-pitch" {...vertical} axis="y" />}
          <assembly.drawing.dimension name="width" widthOfView />
          <assembly.drawing.dimension name="height" heightOfView />
        </assembly.drawing.partview>
        <assembly.drawing.partview name="ports" displayName="Connectors · component side"
          partRef=".populated" direction="z+" width={83} height={78} centerX={0} centerY={1}>
          {mount.usbPorts.map(port => (
            <assembly.drawing.partlabel key={port.ref} name={port.ref} partRefs={[".populated"]}
              text={mount.usbPorts.length === 1 ? port.ref + " USB-C" : port.ref}
              anchor={{x: port.x, y: port.y, z: thickness/2 + 2}} {...portLabel(port)} />
          ))}
          {mount.controls?.map(control => (
            <assembly.drawing.partlabel key={control.ref} name={control.ref} partRefs={[".populated"]}
              text={control.label} anchor={{x: control.x, y: control.y, z: thickness/2 + 2}}
              xOffsetFromViewCenter={control.labelX} yOffsetFromViewCenter={control.labelY} />
          ))}
          {mount.speakerHeader && (
            <assembly.drawing.partlabel partRefs={[".populated"]} text="J2 · JST SH"
              anchor={{x: mount.speakerHeader.x, y: mount.speakerHeader.y, z: thickness/2 + 2.5}}
              xOffsetFromViewCenter={-42} yOffsetFromViewCenter={49} />
          )}
        </assembly.drawing.partview>
        <assembly.drawing.partview name="iso" displayName="Assembled board · isometric"
          partRef=".populated" direction="isometric" width={94} height={80} centerX={117} centerY={0}>
          {mount.speakerHeader && (
            <assembly.drawing.partlabel partRefs={[".populated"]} text="J2 · Speaker"
              anchor={{x: mount.speakerHeader.x, y: mount.speakerHeader.y, z: thickness/2 + 2.5}}
              xOffsetFromViewCenter={10} yOffsetFromViewCenter={50} />
          )}
        </assembly.drawing.partview>
        <assembly.drawing.note text={holes.length + " × Ø" + diameter + " through · PCB thickness " + thickness + " mm"}
          paperX={-169} paperY={-67} fontSize={3.8} />
        <assembly.drawing.note text={"Hole centres from lower left: X = " + holeOffsets(0, width) + " mm; Y = " + holeOffsets(1, height) + " mm"}
          paperX={-169} paperY={-77} fontSize={3.4} />
        {mount.usbPorts.length > 1 && mount.usbPorts.map((port, i) => (
          <assembly.drawing.note key={port.ref} text={port.ref + " USB-C · " + port.role}
            paperX={-28 + Math.floor(i / 3) * 74} paperY={-61 - (i % 3) * 9} fontSize={3.6} />
        ))}
        {mount.swdHeader && <>
          <assembly.drawing.note text="J_SWD · JST SH · 5 pins · 1 mm" paperX={98} paperY={-61} fontSize={3.6} />
          <assembly.drawing.note text="Top entry · BM05B-SRSS-TB" paperX={100} paperY={-70} fontSize={3.4} />
          <assembly.drawing.note text="1 NC · 2 SWDIO · 3 GND · 4 SWCLK · 5 RESET" paperX={100} paperY={-79} fontSize={2.9} />
        </>}
        {mount.undersidePads && <>
          <assembly.drawing.note text="SWD · underside pads" paperX={104} paperY={-61} fontSize={3.8} />
          <assembly.drawing.note text={mount.undersidePads} paperX={104} paperY={-70} fontSize={3.0} />
        </>}
        {mount.speakerHeader && <>
          <assembly.drawing.note text="J2  JST SH · 2 pins · 1 mm pitch · top entry" paperX={-28} paperY={-60} fontSize={3.8} />
          <assembly.drawing.note text="Board BM02B-SRSS-TB · Cable SHR-02V-S-B" paperX={-28} paperY={-70} fontSize={3.4} />
          <assembly.drawing.note text="Pin 1 red (+) · Pin 2 black (−)" paperX={-28} paperY={-80} fontSize={3.4} />
        </>}
      </assembly.drawing.page>
    </assembly.device>
  )
}
