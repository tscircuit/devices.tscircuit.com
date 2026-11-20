export async function openToggle(handle) {
  await handle.open({baudRate:9600, flowControl:"none"})
  try {
    await handle.setSignals({dataTerminalReady:false})
    await handle.getSignals()
  } catch (err) {
    await handle.close().catch(() => {})
    throw err
  }
  const session = {handle, kind:"toggle", async close() {
    session.stopped = true
    await session.loop
    await handle.close().catch(() => {})
  }}
  return session
}

export function startToggle(root, session, failed) {
  const panel = root.getElementById("toggle")
  const output = root.getElementById("switch-state")
  root.getElementById("serial").hidden = true
  panel.hidden = false
  output.textContent = "Reading…"
  session.loop = (async () => {
    let candidate, since
    while (!session.stopped) {
      const {clearToSend} = await session.handle.getSignals()
      if (typeof clearToSend !== "boolean") throw Error("Switch signal unavailable")
      const now = performance.now()
      if (clearToSend !== candidate) {
        candidate = clearToSend
        since = now
      } else if (now - since >= 20) {
        const label = candidate ? "On" : "Off"
        if (output.textContent !== label) output.textContent = label
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  })().catch(err => { if (!session.stopped) queueMicrotask(() => failed(err)) })
  return () => { panel.hidden = true }
}
