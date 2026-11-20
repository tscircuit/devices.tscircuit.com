const encoder = new TextEncoder()
export async function identifySerial(port) {
  await port.open({baudRate: 115200})
  let reader, writer, timer, failIdentity, matched, closing
  const session = {port, onLine() {}, onEnd() {}}
  async function close() {
    if (!closing) closing = (async () => {
      try { await reader?.cancel() } catch {}
      await session.readTask
      writer?.releaseLock()
      await port.close().catch(() => {})
    })()
    return closing
  }
  session.close = close
  try {
    await port.setSignals({dataTerminalReady: true})
    reader = port.readable.getReader()
    writer = port.writable.getWriter()
    session.write = value => writer.write(typeof value === "string" ? encoder.encode(value + "\n") : value)
    const identity = new Promise((resolve, reject) => {
      failIdentity = reject
      matched = resolve
      timer = setTimeout(() => reject(Error("No device identity received.")), 2500)
    })
    session.readTask = (async () => {
      const decoder = new TextDecoder()
      let tail = "", error
      try {
        while (true) {
          const {value, done} = await reader.read()
          if (done) break
          tail += decoder.decode(value,{stream:true})
          const lines = tail.split("\n")
          tail = lines.pop().slice(-2048)
          for (const raw of lines) {
            const line = raw.trimEnd()
            const id = /^DEVICE tscircuit ([\w-]+) ([\w.-]+)$/.exec(line)
            if (id) matched({kind:id[1], version:id[2]})
            session.onLine(line)
          }
        }
      } catch (err) { error = err }
      finally {
        reader.releaseLock()
        session.ended = true
        failIdentity(error || Error("Port disconnected."))
        session.onEnd(error)
      }
    })()
    const [id] = await Promise.all([identity, session.write("id")])
    return Object.assign(session, id)
  } catch (err) {
    await close()
    throw err
  } finally { clearTimeout(timer) }
}
