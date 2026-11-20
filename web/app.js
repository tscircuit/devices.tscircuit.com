const el = id => document.getElementById(id)
const connect = el("connect")
const state = el("state")
const log = el("log")
let current

function record(line) {
  log.textContent = (log.textContent + line + "\n").slice(-12000)
  log.scrollTop = log.scrollHeight
}

function controls(connected) {
  el("command").disabled = el("send").disabled = !connected
  document.querySelector("[data-command=help]").disabled = !connected
  connect.textContent = connected ? "Disconnect" : "Connect device"
}

async function send(command) {
  const session = current
  if (!session?.writer || session.closing) return
  try {
    await session.writer.write(new TextEncoder().encode(command + "\n"))
    record("> " + command)
  } catch (err) {
    await close(session, err.message)
  }
}

async function close(session, message) {
  if (!session || session.closing) return
  session.closing = true
  clearTimeout(session.timer)
  connect.disabled = true
  controls(false)
  el("buzzer").hidden = true
  try {
    await session.reader?.cancel()
    await session.readTask
  } catch (err) { record(err.message) }
  session.writer?.releaseLock()
  try { await session.port.close() } catch (err) { record(err.message) }
  current = undefined
  el("device").textContent = "Select a device"
  state.textContent = message
  connect.disabled = false
}

async function read(session) {
  const decoder = new TextDecoder()
  let pending = ""
  try {
    while (!session.closing) {
      const { value, done } = await session.reader.read()
      if (done) break
      pending += decoder.decode(value, {stream: true})
      const lines = pending.split("\n")
      pending = lines.pop().slice(-2048)
      for (const raw of lines) {
        const line = raw.trimEnd()
        record(line)
        const match = /^DEVICE tscircuit ([\w-]+) ([\w.-]+)$/.exec(line)
        if (match) {
          clearTimeout(session.timer)
          el("device").textContent = "tscircuit " + match[1]
          state.textContent = "Connected · Firmware " + match[2]
          el("rate-field").hidden = !/^1\.([1-9]\d*)\./.test(match[2])
          el("buzzer").hidden = match[1] !== "buzzer"
        }
      }
    }
  } catch (err) { record(err.message) }
  finally {
    session.reader.releaseLock()
    if (!session.closing) queueMicrotask(() => close(session, "Device disconnected."))
  }
}

connect.onclick = async () => {
  if (current) return close(current, "Disconnected.")
  connect.disabled = true
  try {
    const port = await navigator.serial.requestPort({filters: [{usbVendorId: 0x1209, usbProductId: 0xc550}]})
    await port.open({baudRate: 115200})
    const session = current = {port}
    await port.setSignals({dataTerminalReady: true})
    session.writer = port.writable.getWriter()
    session.reader = port.readable.getReader()
    log.textContent = ""
    state.textContent = "Identifying device…"
    controls(true)
    session.readTask = read(session)
    session.timer = setTimeout(() => { state.textContent = "Connected · No device identity received." }, 2000)
    await send("id")
  } catch (err) {
    const message = err.name === "NotFoundError" ? "No device selected." : err.message
    if (current) await close(current, message)
    else state.textContent = message
  } finally { connect.disabled = false }
}

el("play").onsubmit = event => {
  event.preventDefault()
  const ms = el("duration").valueAsNumber
  const hz = el("rate").valueAsNumber
  send(!el("rate-field").hidden && hz && ms ? `tone ${hz} ${ms}` : `beep ${ms}`)
}
el("terminal").onsubmit = event => {
  event.preventDefault()
  const input = el("command")
  if (input.value.trim()) send(input.value.trim())
  input.value = ""
}
for (const button of document.querySelectorAll("[data-command]"))
  button.onclick = () => send(button.dataset.command)

if (!navigator.serial) {
  connect.disabled = true
  state.textContent = "Open this page in desktop Chrome or Edge to use Web Serial."
}
