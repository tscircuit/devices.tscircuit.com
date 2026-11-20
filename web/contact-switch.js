const switchLabels = {
  toggle: ["Off", "On"],
  limit: ["Pressed", "Released"],
  button: ["Released", "Pressed"]
}

export function isContactSwitch(kind) {
  return Object.hasOwn(switchLabels, kind)
}

async function readUsbSwitch(handle) {
  // CH340 modem status registers, with active-low CTS in bit 0.
  const result = await handle.controlTransferIn({
    requestType:"vendor", recipient:"device", request:0x95, value:0x0706, index:0
  }, 2)
  if (result.status !== "ok" || result.data?.byteLength !== 2) throw Error("Switch status read failed")
  return (result.data.getUint8(0) & 1) === 0
}

export async function openSwitch(handle, kind, usb) {
  if (!isContactSwitch(kind)) throw Error("Choose the connected switch type.")
  const readSwitch = usb ? () => readUsbSwitch(handle) : async () => (await handle.getSignals()).clearToSend
  if (usb) await handle.open()
  else await handle.open({baudRate:9600, flowControl:"none"})
  try {
    if (!usb) await handle.setSignals({dataTerminalReady:false})
    await readSwitch()
  } catch (err) {
    await handle.close().catch(() => {})
    throw err
  }
  const session = {handle, readSwitch, kind, async close() {
    session.stopped = true
    await session.loop
    await handle.close().catch(() => {})
  }}
  return session
}

export function startSwitch(root, session, failed) {
  const panel = root.getElementById("toggle")
  const output = root.getElementById("switch-state")
  root.getElementById("serial").hidden = true
  panel.hidden = false
  output.textContent = "Reading…"
  session.loop = (async () => {
    let candidate, since
    while (!session.stopped) {
      const clearToSend = await session.readSwitch()
      if (typeof clearToSend !== "boolean") throw Error("Switch signal unavailable")
      const now = performance.now()
      if (clearToSend !== candidate) {
        candidate = clearToSend
        since = now
      } else if (now - since >= 20) {
        const label = switchLabels[session.kind][Number(candidate)]
        if (output.textContent !== label) output.textContent = label
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  })().catch(err => { if (!session.stopped) queueMicrotask(() => failed(err)) })
  return () => { panel.hidden = true }
}
